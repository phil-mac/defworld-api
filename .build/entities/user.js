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
  type Query {
    user(id: ID!): User!
    users: [User!]!
  }

  type Mutation {
    createUser(username: String!): User!
  }

  type User {
    id: ID!
    username: String!
    worldUsers: [WorldUser!]!
  }
`;
const define = (sequelize) => sequelize.define("user", {
  username: {
    type: import_sequelize.DataTypes.STRING,
    allowNull: false
  }
}, {});
const resolvers = (models) => ({
  Query: {
    user: async (parent, args) => {
      const { id } = args;
      return await models.user.findOne({ where: { id } });
    },
    users: async () => {
      return await models.user.findAll();
    }
  },
  Mutation: {
    createUser: async (parent, args) => {
      const { username } = args;
      const existingUser = await models.user.findOne({ where: { username } });
      if (!!existingUser) {
        return existingUser.toJSON();
      } else {
        const user = await models.user.create({ username });
        return user.toJSON();
      }
    }
  },
  User: {
    worldUsers: async (user) => {
      return await models.worldUser.findAll({ where: { userId: user.id } });
    }
  }
});
module.exports = { typeDefs, define, resolvers };
//# sourceMappingURL=user.js.map
