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
var import_fs = __toModule(require("fs"));
var import_merge = __toModule(require("lodash/merge"));
var import_apollo_server_core = __toModule(require("apollo-server-core"));
var import_sequelize = __toModule(require("sequelize"));
var import_schema = __toModule(require("@graphql-tools/schema"));
const sequelize = new import_sequelize.Sequelize(process.env.POSTGRES);
const entities = [];
const models = {};
const typeDefImports = [];
import_fs.default.readdirSync("./entities").forEach((file) => {
  const entityName = file.slice(0, -3);
  const entity = require("./entities/" + entityName);
  for (const property of ["define", "resolvers", "typeDefs"]) {
    if (!entity[property])
      console.error(`No "${property}" found for "${entityName}" entity.`);
  }
  entities.push(entity);
  models[entityName] = entity.define(sequelize);
  typeDefImports.push(entity.typeDefs);
});
const typeDefs = import_apollo_server_core.gql`${typeDefImports.join("")}`;
models.world.belongsToMany(models.user, { through: models.worldUser });
models.user.belongsToMany(models.world, { through: models.worldUser });
models.world.hasMany(models.node);
models.node.belongsTo(models.world);
const resolvers = {};
entities.forEach((entity) => {
  const entityResolvers = entity.resolvers(models);
  (0, import_merge.default)(resolvers, entityResolvers);
});
const schema = (0, import_schema.makeExecutableSchema)({ typeDefs, resolvers });
const seedDatabase = async () => {
  await sequelize.sync({ force: true });
  const userOne = await models.user.create({ username: "Phil" });
  const worldOne = await models.world.create({ name: "Terra One" });
  await models.worldUser.create({ userId: userOne.id, worldId: worldOne.id });
  await models.world.create({ name: "New world" });
  await resolvers.Mutation.createNode(void 0, { worldId: worldOne.id, pos: [10, 0, 25] });
  await resolvers.Mutation.createNode(void 0, { worldId: worldOne.id, pos: [10, 0, 10] });
  await resolvers.Mutation.createNode(void 0, { worldId: worldOne.id, pos: [18, 0, 10] });
};
module.exports = { schema, seedDatabase, models };
//# sourceMappingURL=schema.js.map
