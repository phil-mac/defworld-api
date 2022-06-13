const { DataTypes } = require('sequelize');
const { withFilter } = require('graphql-subscriptions');
const { gridSideLength } = require('./world');
const interpreterService = require('../services/interpreterService');

const typeDefs = `
  type Query {
    node(id: ID!): Node!
  }

  type Mutation {
    createNode(worldId: ID!, pos: [Int!]!): Node!
  }

  type Subscription {
    nodeCreated(worldId: ID!): World!
  }

  type Node {
    id: ID!
    content: String!
    result: String
    blocks: String
    pos: [Int!]!
  }
`;

const define = sequelize => sequelize.define('node', {
  content: {
    type: DataTypes.STRING(4096),
    allowNull: false,
    defaultValue: ''
  },
  pos: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false
  }
});

const resolvers = (models, pubsub) => ({
  Query: {
    node: async (parent: any, args: any) => {
      const { id } = args;
      return await models.node.findOne({ where: { id } });
    },
  },
  Mutation: {
    createNode: async (parent: any, args: any) => {
      const { worldId, pos } = args;
      const scriptNode = await models.node.create({ worldId, pos });

      const world = await models.world.findOne({ where: { id: worldId }});
      const grid = world.toJSON().grid; // [ [1,1], [2,2] ]

      const index = pos[0] + (gridSideLength * pos[2]) + (gridSideLength * gridSideLength * pos[1]);
      grid[index] = [scriptNode.id, 50];

      let updatedWorld = await models.world.update({grid}, {where: {id: worldId}, returning: true, plain: true});
      updatedWorld = updatedWorld[1].toJSON();

      pubsub.publish('NODE_CREATED', { nodeCreated: updatedWorld });
      
      return scriptNode.toJSON();
    },
  },
  Subscription: {
    nodeCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['NODE_CREATED']),
        (payload, variables) =>  {
          const isSpecificWorld = payload.nodeCreated.id == variables.worldId
          return isSpecificWorld;
        }
      ),
    }
  },
});

module.exports = { typeDefs, define, resolvers }