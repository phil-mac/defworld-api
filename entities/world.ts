const { DataTypes } = require('sequelize');
const gridSideLength = 50;

const typeDefs = `
  type World {
    id: ID!
    name: String!
    nodes: [Node!]
    grid: [[Int!]!]
    worldUsers: [WorldUser!]!
  }

  type Query {
    world(id: ID!): World!
    worlds: [World!]!
  }

  type Mutation {
    createWorld(name: String!): World!
  }
`;

const define = (sequelize) => sequelize.define('world', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grid: {
    type: DataTypes.ARRAY(DataTypes.ARRAY(DataTypes.INTEGER)),
    allowNull: false,
    defaultValue: [...Array(Math.pow(gridSideLength, 2))].map(e => Array(2).fill(0))
  }
});

const resolvers = models => ({
  Query: {
    world: async (parent: any, args: any) => {
      const { id } = args;
      return await models.world.findOne({ where: { id } });
    },
    worlds: async () => {
      return await models.world.findAll();
    }
  },
  Mutation: {
    createWorld: async (parent: any, args: any) => {
      const { name } = args;
      const world = await models.world.create({ name });
      return world.toJSON();
    },
  },
  World: {
    nodes: async (world: any) => {
      return await models.node.findAll({ where: { worldId: world.id }, order: [['id', 'ASC']] });
    },
    worldUsers: async (world: any) => {
      return await models.worldUser.findAll({ where: { worldId: world.id }});
    },
  },
});


module.exports = { typeDefs, define, resolvers, gridSideLength };