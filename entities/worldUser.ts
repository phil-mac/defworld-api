import { DataTypes, Sequelize } from 'sequelize';

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

const define = (sequelize: Sequelize) => sequelize.define('worldUser', {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
  },
  lastVisited: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: (new Date()).getTime()
  },
});

const resolvers = (models: any) => ({
  WorldUser: {
    user: async (worldUser: any) => {
      return await models.user.findOne({ where: { id: worldUser.userId } });
    },
    world: async (worldUser: any) => {
      return await models.world.findOne({ where: { id: worldUser.worldId } });
    }
  }
});

module.exports = { typeDefs, define, resolvers };