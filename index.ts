// https://api.elephantsql.com/console/22b867f3-f91d-4cc1-a98f-0ca00c11f316/browser

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const { ApolloServer, gql } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { interpretGen } = require('./interpreterService');


const app = express();
app.use(cors());

app.get('/', async (req: any, res: any) => {
  res.send('Hello world');
});

const typeDefs = gql(`
  type Query {
    hello: String!
    users: [User!]!
    worlds: [World!]!
    world(id: ID!): World!
    node(id: ID!): Node!
  }

  type Mutation {
    createUser(name: String!): User!
    createWorld(name: String!): World!
    createNode(worldId: ID!, pos: [Int!]!): Node!
    updateNodeContent(id: ID!, content: String!): Node!
  }

  type User {
    id: ID!
    name: String!
  }

  type World {
    id: ID!
    name: String!
    nodes: [Node!]
    grid: [[Int!]!]
  }

  type Node {
    id: ID!
    content: String!
    result: String
    blocks: String
    pos: [Int!]!
  }
`);

const gridSideLength = 50;

const sequelize = new Sequelize(process.env.POSTGRES);

const User = sequelize.define('user', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {});

const World = sequelize.define('world', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grid: {
    type: DataTypes.ARRAY(DataTypes.ARRAY(DataTypes.INTEGER)),
    allowNull: false,
    defaultValue: [...Array(Math.pow(gridSideLength, 2))].map(e => Array(2).fill(0))
  }
});

const ScriptNode = sequelize.define('node', {
  content: {
    type: DataTypes.STRING(4096),
    allowNull: false,
    defaultValue: ''
  },
  pos: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false
  }
})

World.hasMany(ScriptNode);
ScriptNode.belongsTo(World);

const resolvers = {
  Query: {
    hello: () => {
      return 'Hello world!';
    },
    users: async () => {
      return await User.findAll();
    },
    worlds: async () => {
      return await World.findAll();
    },
    world: async (parent: any, args: any) => {
      const { id } = args;
      return await World.findOne({ where: { id } });
    },
    node: async (parent: any, args: any) => {
      const { id } = args;
      return await ScriptNode.findOne({ where: { id } });
    }
  },
  Mutation: {
    createUser: async (parent: any, args: any) => {
      const { name } = args;
      const user = await User.create({ name });
      return user.toJSON();
    },
    createWorld: async (parent: any, args: any) => {
      const { name } = args;
      const world = await World.create({ name });
      return world.toJSON();
    },
    createNode: async (parent: any, args: any) => {
      const { worldId, pos } = args;
      const scriptNode = await ScriptNode.create({ worldId, pos });

      // copy paste from below, could be abstracted 
      const world = await World.findOne({ where: { id: worldId }});
      const grid = world.toJSON().grid; // [ [1,1], [2,2] ]
      
      const index = pos[0] + (gridSideLength * pos[1]);
      grid[index] = [scriptNode.id, 50];

      await World.update({grid}, {where: {id: worldId}});
      
      return scriptNode.toJSON();
    },
    updateNodeContent: async (parent: any, args: any) => {
      const { id, content } = args;

      const { result } = await interpretGen(content);
      console.log(result);

      const scriptNode = await ScriptNode.update(
        { content }, 
        { where: { id }, returning: true, plain: true });

      const n = scriptNode[1].toJSON();


      const blocks = result.blocks; // [{x:1, y:1, z:1}, {x:2, y:2, z:2}]

      const world = await World.findOne({ where: { id: n.worldId }});
      const grid = world.toJSON().grid; // [ [1,1], [2,2] ]

      let blocksObj = {};

      
      
      blocks.forEach(block => {
        const x = n.pos[0] + block.x;
        const y = n.pos[1] - block.y;
        const index = x + (gridSideLength * y);
        blocksObj[index] = [n.id, 5];
      });

      // clear grid of old blocks from this node
       grid.forEach((el, i) => {
        if (el[0] === n.id && el[1] !== 50){
          grid[i] = [0, 0];
        }
      })

      grid.forEach((el, i) => {
        let b = blocksObj[i];
        if (!!b){
          grid[i] = b;
        }
      })

      await World.update({grid}, {where: {id: n.worldId}});
      
      return {...n, result: result.result, blocks: JSON.stringify(result.blocks)};
    }
  },
  World: {
    nodes: async (world: any) => {
      return await ScriptNode.findAll({ where: { worldId: world.id }, order: [['id', 'ASC']] });
    }
  }
};

const httpServer = http.createServer(app);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
});

const nodeContent = `(def! 
  line 
  (fn* (len)
    (do
      (block len len len)
      (if (> len 0) 
        (line (- len 1))
        "done"))))

(line 7)
`;

(async () => {
  await sequelize.sync({ force: true });
  await User.create({ name: 'Phil' });

  const worldOne = await World.create({ name: 'Terra One'});
  
  const worldTwo = await World.create({ name: 'New world' });

  await resolvers.Mutation.createNode(undefined, {worldId: worldOne.id, pos: [3, 3]})
  await resolvers.Mutation.createNode(undefined, {worldId: worldOne.id, pos: [5, 2]})
  
  // await ScriptNode.create({ worldId: worldOne.id, content: nodeContent })
  // await ScriptNode.create({ worldId: worldOne.id, content: '42' })

  await server.start();
  server.applyMiddleware({ app });

  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
})();