const { DataTypes } = require("sequelize");
const { withFilter } = require("graphql-subscriptions");
const interpreterService = require("../services/interpreterService");
const typeDefs = `
  type Query {
    node(id: ID!): Node!
  }

  type Mutation {
    createNode(worldId: ID!, pos: [Int!]!): Node!
  }

  type Node {
    id: ID!
    content: String!
    pos: [Int!]!
  }
`;
const define = (sequelize) => sequelize.define("node", {
  content: {
    type: DataTypes.STRING(4096),
    allowNull: false,
    defaultValue: ""
  },
  pos: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false
  }
});
const resolvers = (models, pubsub) => ({
  Query: {
    node: async (parent, args) => {
      const { id } = args;
      return await models.node.findOne({ where: { id } });
    }
  },
  Mutation: {
    createNode: async (parent, args) => {
      const { worldId, pos } = args;
      const scriptNode = await models.node.create({ worldId, pos });
      return scriptNode.toJSON();
    }
  }
});
module.exports = { typeDefs, define, resolvers };
//# sourceMappingURL=node.js.map
