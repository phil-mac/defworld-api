const { DataTypes } = require('sequelize');

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

const define = sequelize => sequelize.define('worldUser', {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
  },
  // userId: {
  //   type: DataTypes.INTEGER,
  //   reference: {
  //     model: User,
  //     key: 'id'
  //   }
  // },
  // worldId: {
  //   type: DataTypes.INTEGER,
  //   references: {
  //     model: World,
  //     key: 'id'
  //   }
  // },
  lastVisited: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: (new Date()).getTime()
  },
});

const resolvers = models => ({
  WorldUser: {
    user: async (worldUser: any) => {
      return await models.user.findOne({where: {id: worldUser.userId}});
    },
    world: async (worldUser: any) => {
      return await models.world.findOne({where: {id: worldUser.worldId}});
    }
  }
});

module.exports = { typeDefs, define, resolvers };