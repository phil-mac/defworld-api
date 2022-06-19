var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var import_sequelize = __toModule(require("sequelize"));
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
    type: import_sequelize.DataTypes.STRING,
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
