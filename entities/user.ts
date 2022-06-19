import { DataTypes } from 'sequelize';

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


const define = sequelize => sequelize.define('user', {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {});

const resolvers = models => ({
  Query: {
    user: async (parent: any, args: any) => {
      const { id } = args;
      return await models.user.findOne({ where: { id } });
    },
    users: async () => {
      return await models.user.findAll();
    },
  },
  Mutation: {
    createUser: async (parent: any, args: any) => {
      const { username } = args;
      const existingUser = await models.user.findOne({ where: { username }});
      if (!!existingUser){
        return existingUser.toJSON();
      } else {
        const user = await models.user.create({ username });
        return user.toJSON();
      } 
    },
  },
  User: {
    worldUsers: async (user: any) => {
      return await models.worldUser.findAll({ where: { userId: user.id }});
    },
  },
});


module.exports = { typeDefs, define, resolvers };