var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const express = require("express");
const http = require("http");
const cors = require("cors");
const sockets = require("socket.io");
const { Sequelize, DataTypes } = require("sequelize");
const { ApolloServer, gql } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const { PubSub, withFilter } = require("graphql-subscriptions");
const { interpretGen } = require("./interpreterService");
const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = sockets(httpServer, {
  cors: {
    origin: "*",
    handlePreflightRequest: (req, res) => {
      console.log("um hi");
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST"
      });
      red.end();
    }
  }
});
app.get("/", async (req, res) => {
  res.send("Hello world");
});
const socketWorlds = {};
const socketNodes = {};
io.on("connection", (socket) => {
  console.log("client connected to socket");
  socket.on("joinWorld", ({ name, worldId }) => {
    socket.join(`world-${worldId}`);
    socketWorlds[socket.id] = `world-${worldId}`;
    console.log({ socketWorlds });
    socket.in(`world-${worldId}`).emit("broadcast", name + "joined world " + worldId);
  });
  socket.on("message", (data) => {
    console.log("new message: " + data);
    console.log("room: ", socketWorlds[socket.id]);
    io.in(socketWorlds[socket.id]).emit("broadcast", data);
  });
  socket.on("joinNode", ({ name, nodeId }) => {
    socket.join(`node-${nodeId}`);
    socketNodes[socket.id] = `node-${nodeId}`;
    console.log({ socketNodes });
    socket.in(`node-${nodeId}`).emit("broadcast", name + "joined node " + nodeId);
  });
  socket.on("leaveNode", ({ name, nodeId }) => {
    socket.leave(`node-${nodeId}`);
    delete socketNodes[socket.id];
    console.log({ socketNodes });
    socket.in(`node-${nodeId}`).emit("broadcast", name + "left node " + nodeId);
  });
  socket.on("updateText", ({ type, pos, text }) => {
    console.log("broadcast update text");
    socket.in(socketNodes[socket.id]).emit("textUpdated", { type, pos, text });
  });
  socket.on("disconnect", () => {
    console.log("client disconnected from socket");
    delete socketWorlds[socket.id];
    delete socketNodes[socket.id];
  });
});
const pubsub = new PubSub();
const typeDefs = gql(`
  type Query {
    hello: String!
    user(id: ID!): User!
    users: [User!]!
    world(id: ID!): World!
    worlds: [World!]!
    node(id: ID!): Node!
  }

  type Mutation {
    createUser(username: String!): User!
    createWorld(name: String!): World!
    createNode(worldId: ID!, pos: [Int!]!): Node!
    updateNodeContent(id: ID!, content: String!): Node!
  }

  type Subscription {
    nodeCreated(worldId: ID!): World!
  }

  type User {
    id: ID!
    username: String!
    worldUsers: [WorldUser!]!
  }

  type World {
    id: ID!
    name: String!
    nodes: [Node!]
    grid: [[Int!]!]
    worldUsers: [WorldUser!]!
  }

  type WorldUser {
    id: ID!
    userId: ID!
    user: User!
    worldId: ID!
    world: World!
    lastVisited: Float!
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
const User = sequelize.define("user", {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {});
const World = sequelize.define("world", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grid: {
    type: DataTypes.ARRAY(DataTypes.ARRAY(DataTypes.INTEGER)),
    allowNull: false,
    defaultValue: [...Array(Math.pow(gridSideLength, 2))].map((e) => Array(2).fill(0))
  }
});
const WorldUser = sequelize.define("worldUser", {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    reference: {
      model: User,
      key: "id"
    }
  },
  worldId: {
    type: DataTypes.INTEGER,
    references: {
      model: World,
      key: "id"
    }
  },
  lastVisited: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: new Date().getTime()
  }
});
World.belongsToMany(User, { through: WorldUser });
User.belongsToMany(World, { through: WorldUser });
const ScriptNode = sequelize.define("node", {
  content: {
    type: DataTypes.STRING(4096),
    allowNull: false,
    defaultValue: ""
  },
  pos: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false
  }
});
World.hasMany(ScriptNode);
ScriptNode.belongsTo(World);
const resolvers = {
  Query: {
    hello: () => {
      return "Hello world!";
    },
    user: async (parent, args) => {
      const { id } = args;
      return await User.findOne({ where: { id } });
    },
    users: async () => {
      return await User.findAll();
    },
    world: async (parent, args) => {
      const { id } = args;
      return await World.findOne({ where: { id } });
    },
    worlds: async () => {
      return await World.findAll();
    },
    node: async (parent, args) => {
      const { id } = args;
      return await ScriptNode.findOne({ where: { id } });
    }
  },
  Mutation: {
    createUser: async (parent, args) => {
      const { username } = args;
      const existingUser = await User.findOne({ where: { username } });
      if (!!existingUser) {
        return existingUser.toJSON();
      } else {
        const user = await User.create({ username });
        return user.toJSON();
      }
    },
    createWorld: async (parent, args) => {
      const { name } = args;
      const world = await World.create({ name });
      return world.toJSON();
    },
    createNode: async (parent, args) => {
      const { worldId, pos } = args;
      const scriptNode = await ScriptNode.create({ worldId, pos });
      const world = await World.findOne({ where: { id: worldId } });
      const grid = world.toJSON().grid;
      const index = pos[0] + gridSideLength * pos[1];
      grid[index] = [scriptNode.id, 50];
      let updatedWorld = await World.update({ grid }, { where: { id: worldId }, returning: true, plain: true });
      updatedWorld = updatedWorld[1].toJSON();
      pubsub.publish("NODE_CREATED", { nodeCreated: updatedWorld });
      return scriptNode.toJSON();
    },
    updateNodeContent: async (parent, args) => {
      const { id, content } = args;
      const { result } = await interpretGen(content);
      console.log(result);
      const scriptNode = await ScriptNode.update({ content }, { where: { id }, returning: true, plain: true });
      const n = scriptNode[1].toJSON();
      const blocks = result.blocks;
      const world = await World.findOne({ where: { id: n.worldId } });
      const grid = world.toJSON().grid;
      let blocksObj = {};
      blocks.forEach((block) => {
        const x = n.pos[0] + block.x;
        const y = n.pos[1] - block.y;
        const index = x + gridSideLength * y;
        blocksObj[index] = [n.id, 5];
      });
      grid.forEach((el, i) => {
        if (el[0] === n.id && el[1] !== 50) {
          grid[i] = [0, 0];
        }
      });
      grid.forEach((el, i) => {
        let b = blocksObj[i];
        if (!!b) {
          grid[i] = b;
        }
      });
      await World.update({ grid }, { where: { id: n.worldId } });
      return __spreadProps(__spreadValues({}, n), { result: result.result, blocks: JSON.stringify(result.blocks) });
    }
  },
  Subscription: {
    nodeCreated: {
      subscribe: withFilter(() => pubsub.asyncIterator(["NODE_CREATED"]), (payload, variables) => {
        const isSpecificWorld = payload.nodeCreated.id == variables.worldId;
        return isSpecificWorld;
      })
    }
  },
  User: {
    worldUsers: async (user) => {
      return await WorldUser.findAll({ where: { userId: user.id } });
    }
  },
  World: {
    nodes: async (world) => {
      return await ScriptNode.findAll({ where: { worldId: world.id }, order: [["id", "ASC"]] });
    },
    worldUsers: async (world) => {
      return await WorldUser.findAll({ where: { worldId: world.id } });
    }
  },
  WorldUser: {
    user: async (worldUser) => {
      return await User.findOne({ where: { id: worldUser.userId } });
    },
    world: async (worldUser) => {
      return await World.findOne({ where: { id: worldUser.worldId } });
    }
  }
};
const schema = makeExecutableSchema({ typeDefs, resolvers });
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/subscriptions"
});
const serverCleanup = useServer({ schema }, wsServer);
const server = new ApolloServer({
  schema,
  csrfPrevention: true,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          }
        };
      }
    }
  ]
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
const shouldResetDB = false;
(async () => {
  if (shouldResetDB) {
    await sequelize.sync({ force: true });
    const userOne = await User.create({ username: "Phil" });
    const worldOne = await World.create({ name: "Terra One" });
    await WorldUser.create({ userId: userOne.id, worldId: worldOne.id });
    const worldTwo = await World.create({ name: "New world" });
    await resolvers.Mutation.createNode(void 0, { worldId: worldOne.id, pos: [3, 3] });
    await resolvers.Mutation.createNode(void 0, { worldId: worldOne.id, pos: [5, 2] });
  }
  await server.start();
  server.applyMiddleware({ app });
  await new Promise((resolve) => httpServer.listen({ port: 4e3 }, resolve));
})();
//# sourceMappingURL=index.js.map
