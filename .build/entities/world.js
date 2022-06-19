const { DataTypes } = require("sequelize");
const typeDefs = `
  type World {
    id: ID!
    name: String!
    nodes: [Node!]
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
const define = (sequelize) => sequelize.define("world", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
});
const resolvers = (models) => ({
  Query: {
    world: async (parent, args) => {
      const { id } = args;
      return await models.world.findOne({ where: { id } });
    },
    worlds: async () => {
      return await models.world.findAll();
    }
  },
  Mutation: {
    createWorld: async (parent, args) => {
      const { name } = args;
      const world = await models.world.create({ name });
      return world.toJSON();
    }
  },
  World: {
    nodes: async (world) => {
      return await models.node.findAll({ where: { worldId: world.id }, order: [["id", "ASC"]] });
    },
    worldUsers: async (world) => {
      return await models.worldUser.findAll({ where: { worldId: world.id } });
    }
  }
});
module.exports = { typeDefs, define, resolvers };
//# sourceMappingURL=world.js.map
