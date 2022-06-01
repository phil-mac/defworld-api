// https://api.elephantsql.com/console/22b867f3-f91d-4cc1-a98f-0ca00c11f316/browser

const http = require('http');
const express = require('express');
const cors = require('cors');
const sockets = require('socket.io');

const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');

const socketService = require('./services/socketService');

const { schema, seedDatabase } = require('./schema');

// ---- express ----
const app = express();
app.use(cors());
app.get('/', async (req: any, res: any) => {
  res.send('Hello world');
});

// ---- http ----
const httpServer = http.createServer(app);

// ---- sockets ----
const io = sockets(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
});

// ---- graphQL ----
// const wsServer = new WebSocketServer({
//   server: httpServer,
//   path: '/subscriptions',
// });
// const serverCleanup = useServer({ schema }, wsServer);
const server = new ApolloServer({
  schema,
  csrfPrevention: false,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // {
    //   async serverWillStart() {
    //     return {
    //       async drainServer() {
    //         await serverCleanup.dispose();
    //       }
    //     }
    //   }
    // }
  ]
});

// ---- seed? & listen ----
(async () => {
  if (false) await seedDatabase();
  
  await server.start();
  server.applyMiddleware({ app });

  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
  
  socketService.init(io);
})();