const http = require("http");
const express = require("express");
const cors = require("cors");
const sockets = require("socket.io");
const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const socketService = require("./services/socketService");
const { schema, seedDatabase } = require("./schema");
const app = express();
app.use(cors());
app.get("/", async (req, res) => {
  res.send("Hello world");
});
const httpServer = http.createServer(app);
const io = sockets(httpServer, {
  cors: {
    origin: "*",
    handlePreflightRequest: (req, res) => {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST"
      });
      res.end();
    }
  }
});
socketService.init(io);
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
(async () => {
  if (false)
    await seedDatabase();
  await server.start();
  server.applyMiddleware({ app });
  await new Promise((resolve) => httpServer.listen({ port: 4e3 }, resolve));
})();
//# sourceMappingURL=index.js.map
