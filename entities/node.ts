import { DataTypes, Sequelize } from 'sequelize';

const typeDefs = `
  type Query {
    node(id: ID!): Node!
  }

  type Node {
    id: ID!
    content: String!
    pos: [Int!]!
  }
`;

const define = (sequelize: Sequelize) => sequelize.define('node', {
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

const resolvers = (models: any) => ({
  Query: {
    node: async (parent: any, args: any) => {
      const { id } = args;
      return await models.node.findOne({ where: { id } });
    },
  },
});

module.exports = { typeDefs, define, resolvers }