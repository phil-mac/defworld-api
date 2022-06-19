var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var import_http = __toModule(require("http"));
var import_express = __toModule(require("express"));
var import_cors = __toModule(require("cors"));
var import_socket = __toModule(require("socket.io"));
var import_apollo_server_express = __toModule(require("apollo-server-express"));
var import_apollo_server_core = __toModule(require("apollo-server-core"));
var import_sockets = __toModule(require("./sockets"));
var import_schema = __toModule(require("./schema"));
const app = (0, import_express.default)();
app.use((0, import_cors.default)());
app.get("/", async (req, res) => {
  res.send("Hello world");
});
const httpServer = import_http.default.createServer(app);
const io = (0, import_socket.default)(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const server = new import_apollo_server_express.ApolloServer({
  schema: import_schema.schema,
  csrfPrevention: true,
  plugins: [(0, import_apollo_server_core.ApolloServerPluginDrainHttpServer)({ httpServer })]
});
(async () => {
  if (false)
    await seedDatabase();
  await server.start();
  server.applyMiddleware({ app });
  await new Promise((resolve) => httpServer.listen({ port: 4e3 }, resolve));
  (0, import_sockets.initSocketService)(io);
})();
//# sourceMappingURL=index.js.map
