// Postgres database: https://api.elephantsql.com/console/22b867f3-f91d-4cc1-a98f-0ca00c11f316/browser

import http from 'http';
import express from 'express';
import cors from 'cors';
import sockets from 'socket.io';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';

import {initSocketService} from './services/socketService';

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
const server = new ApolloServer({
  schema,
  csrfPrevention: true,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
});

// ---- listen, with option of seeding database ----
(async () => {
  if (false) await seedDatabase();
  
  await server.start();
  server.applyMiddleware({ app });

  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
  
  initSocketService(io);
})();


