import fs from 'fs';
import merge from 'lodash/merge';
import { gql } from 'apollo-server-core';
import { Sequelize } from 'sequelize';
import { makeExecutableSchema } from '@graphql-tools/schema';

const sequelize = new Sequelize(process.env.POSTGRES as string);

const entities: any[] = [];
const models: Record<string, any> = {};
const typeDefImports: string[] = [];

fs.readdirSync('./entities').forEach(file => {
  const entityName = file.slice(0, -3);
  const entity = require('./entities/' + entityName);

  for (const property of ['define', 'resolvers', 'typeDefs']) {
    if (!entity[property]) console.error(`No "${property}" found for "${entityName}" entity.`)
  }

  entities.push(entity);
  
  models[entityName] = entity.define(sequelize);

  typeDefImports.push(entity.typeDefs);
});

const typeDefs = gql`${typeDefImports.join('')}`;

// could import "association" functions here from elsewhere and call them here using `models`
models.world.belongsToMany(models.user, { through: models.worldUser });
models.user.belongsToMany(models.world, { through: models.worldUser });
models.world.hasMany(models.node);
models.node.belongsTo(models.world);

const resolvers = {};
entities.forEach(entity => {
  const entityResolvers = entity.resolvers(models);
  merge(resolvers, entityResolvers);
});


const schema = makeExecutableSchema({ typeDefs, resolvers });

// could import seedDatabase functions from elsewhere, and call using `models` here
const seedDatabase = async () => {
  await sequelize.sync({ force: true });
  
  const userOne = await models.user.create({ username: 'Phil' });
  const worldOne = await models.world.create({ name: 'Terra One'});

  await models.worldUser.create({ userId: userOne.id, worldId: worldOne.id });
  
  await models.world.create({ name: 'New world' });

  await models.node.create({worldId: worldOne.id, pos: [10, 0, 25]})
  await models.node.create({worldId: worldOne.id, pos: [10, 0, 10]})
  await models.node.create({worldId: worldOne.id, pos: [18, 0, 10]})
}

module.exports = { schema, seedDatabase, models };
