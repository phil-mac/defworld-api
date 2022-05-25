const fs = require("fs");
const merge = require("lodash/merge");
const { gql } = require("apollo-server-core");
const { PubSub } = require("graphql-subscriptions");
const { Sequelize } = require("sequelize");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const sequelize = new Sequelize(process.env.POSTGRES);
const pubsub = new PubSub();
const entities = [];
const models = {};
const typeDefImports = [];
fs.readdirSync("./entities").forEach((file) => {
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
const typeDefs = gql`${typeDefImports.join("")}`;
models.world.belongsToMany(models.user, { through: models.worldUser });
models.user.belongsToMany(models.world, { through: models.worldUser });
models.world.hasMany(models.node);
models.node.belongsTo(models.world);
const resolvers = {};
entities.forEach((entity) => {
  const entityResolvers = entity.resolvers(models, pubsub);
  merge(resolvers, entityResolvers);
});
const schema = makeExecutableSchema({ typeDefs, resolvers });
const seedDatabase = async () => {
  await sequelize.sync({ force: true });
  const userOne = await models.user.create({ username: "Phil" });
  const worldOne = await models.world.create({ name: "Terra One" });
  await models.worldUser.create({ userId: userOne.id, worldId: worldOne.id });
  const worldTwo = await models.world.create({ name: "New world" });
  await resolvers.Mutation.createNode(void 0, { worldId: worldOne.id, pos: [3, 3] });
  await resolvers.Mutation.createNode(void 0, { worldId: worldOne.id, pos: [5, 2] });
};
module.exports = { schema, seedDatabase };
//# sourceMappingURL=schema.js.map
