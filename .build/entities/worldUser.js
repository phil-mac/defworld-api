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
  type WorldUser {
    id: ID!
    userId: ID!
    user: User!
    worldId: ID!
    world: World!
    lastVisited: Float!
  }
`;
const define = (sequelize) => sequelize.define("worldUser", {
  id: {
    primaryKey: true,
    type: import_sequelize.DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true
  },
  lastVisited: {
    type: import_sequelize.DataTypes.BIGINT,
    allowNull: false,
    defaultValue: new Date().getTime()
  }
});
const resolvers = (models) => ({
  WorldUser: {
    user: async (worldUser) => {
      return await models.user.findOne({ where: { id: worldUser.userId } });
    },
    world: async (worldUser) => {
      return await models.world.findOne({ where: { id: worldUser.worldId } });
    }
  }
});
module.exports = { typeDefs, define, resolvers };
//# sourceMappingURL=worldUser.js.map
