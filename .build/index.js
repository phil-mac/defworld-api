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
    methods: ["GET", "POST"]
  }
});
const server = new ApolloServer({
  schema,
  csrfPrevention: false,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer })
  ]
});
(async () => {
  if (true)
    await seedDatabase();
  await server.start();
  server.applyMiddleware({ app });
  await new Promise((resolve) => httpServer.listen({ port: 4e3 }, resolve));
  socketService.init(io);
})();
//# sourceMappingURL=index.js.map
