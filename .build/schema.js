var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
__export(exports, {
  models: () => models,
  schema: () => schema,
  seedDatabase: () => seedDatabase
});
var import_fs = __toModule(require("fs"));
var import_merge = __toModule(require("lodash/merge"));
var import_apollo_server_core = __toModule(require("apollo-server-core"));
var import_sequelize = __toModule(require("sequelize"));
var import_schema = __toModule(require("@graphql-tools/schema"));
const sequelize = new import_sequelize.Sequelize(process.env.POSTGRES);
const models = generateModels();
const typeDefs = generateTypeDefs();
const resolvers = generateResolvers();
const schema = (0, import_schema.makeExecutableSchema)({ typeDefs, resolvers });
const seedDatabase = async () => {
  await sequelize.sync({ force: true });
  const userOne = await models.user.create({ username: "Phil" });
  const worldOne = await models.world.create({ name: "Terra One" });
  await models.worldUser.create({ userId: userOne.id, worldId: worldOne.id });
  await models.world.create({ name: "New world" });
  await models.node.create({ worldId: worldOne.id, pos: [10, 0, 25] });
  await models.node.create({ worldId: worldOne.id, pos: [10, 0, 10] });
  await models.node.create({ worldId: worldOne.id, pos: [18, 0, 10] });
};
function forEachEntityExport(exportName, callback) {
  import_fs.default.readdirSync("./entities").forEach((file) => {
    const entityName = file.slice(0, -3);
    const entity = require("./entities/" + entityName);
    if (!entity[exportName])
      console.error(`No "${exportName}" found for "${entityName}" entity.`);
    callback.call(void 0, entity, entityName);
  });
}
function generateModels() {
  const newModels = {};
  forEachEntityExport("define", (entity, entityName) => {
    newModels[entityName] = entity.define(sequelize);
  });
  newModels.world.belongsToMany(newModels.user, { through: newModels.worldUser });
  newModels.user.belongsToMany(newModels.world, { through: newModels.worldUser });
  newModels.world.hasMany(newModels.node);
  newModels.node.belongsTo(newModels.world);
  return newModels;
}
;
function generateTypeDefs() {
  const typeDefImports = [];
  forEachEntityExport("typeDefs", (entity, entityName) => {
    typeDefImports.push(entity.typeDefs);
  });
  return import_apollo_server_core.gql`${typeDefImports.join("")}`;
}
function generateResolvers() {
  const resolvers2 = {};
  forEachEntityExport("resolvers", (entity, entityName) => {
    const entityResolvers = entity.resolvers(models);
    (0, import_merge.default)(resolvers2, entityResolvers);
  });
  return resolvers2;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  models,
  schema,
  seedDatabase
});
//# sourceMappingURL=schema.js.map
