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
    type: import_sequelize.DataTypes.STRING(4096),
    allowNull: false,
    defaultValue: ""
  },
  pos: {
    type: import_sequelize.DataTypes.ARRAY(import_sequelize.DataTypes.INTEGER),
    allowNull: false
  }
});
const resolvers = (models) => ({
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
