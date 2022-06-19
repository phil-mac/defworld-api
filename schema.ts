import fs from 'fs';
import merge from 'lodash/merge';
import { gql } from 'apollo-server-core';
import { Sequelize } from 'sequelize';
import { makeExecutableSchema } from '@graphql-tools/schema';

const sequelize = new Sequelize(process.env.POSTGRES as string);

export const models = generateModels();

const typeDefs = generateTypeDefs();
const resolvers = generateResolvers();
export const schema = makeExecutableSchema({ typeDefs, resolvers });

// could import seedDatabase functions from elsewhere, and call using `models` here
export const seedDatabase = async () => {
  await sequelize.sync({ force: true });

  const userOne = await models.user.create({ username: 'Phil' });
  const worldOne = await models.world.create({ name: 'Terra One' });

  await models.worldUser.create({ userId: userOne.id, worldId: worldOne.id });

  await models.world.create({ name: 'New world' });

  await models.node.create({ worldId: worldOne.id, pos: [10, 0, 25] })
  await models.node.create({ worldId: worldOne.id, pos: [10, 0, 10] })
  await models.node.create({ worldId: worldOne.id, pos: [18, 0, 10] })
}

// ---- generation functions ---

function forEachEntityExport(exportName: string, callback: (entity: any, entityName: string) => void) {
  fs.readdirSync('./entities').forEach(file => {
    const entityName = file.slice(0, -3);
    const entity = require('./entities/' + entityName);
    if (!entity[exportName]) console.error(`No "${exportName}" found for "${entityName}" entity.`)

    callback.call(undefined, entity, entityName);
  });
}

function generateModels() {
  const newModels: Record<string, any> = {};
  forEachEntityExport('define', (entity, entityName) => {
    newModels[entityName] = entity.define(sequelize);
  })

  // could import "association" functions here from elsewhere and call them here using `modelsasdf`
  newModels.world.belongsToMany(newModels.user, { through: newModels.worldUser });
  newModels.user.belongsToMany(newModels.world, { through: newModels.worldUser });
  newModels.world.hasMany(newModels.node);
  newModels.node.belongsTo(newModels.world);

  return newModels;
};

function generateTypeDefs() {
  const typeDefImports: string[] = [];
  forEachEntityExport('typeDefs', (entity, entityName) => {
    typeDefImports.push(entity.typeDefs);
  })
  return gql`${typeDefImports.join('')}`;
}

function generateResolvers() {
  const resolvers = {};

  forEachEntityExport('resolvers', (entity, entityName) => {
    const entityResolvers = entity.resolvers(models);
    merge(resolvers, entityResolvers);
  })

  return resolvers;
}
