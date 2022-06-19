var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
__export(exports, {
  initSocketService: () => initSocketService
});
var import_state = __toModule(require("@codemirror/state"));
var import_node = __toModule(require("./node"));
var import_world = __toModule(require("./world"));
var import_interpreterService = __toModule(require("../interpreterService"));
var import_blockUtilFns = __toModule(require("../../utils/blockUtilFns"));
const { models } = require("../../schema");
const initSocketService = (io) => {
  const nodes = {};
  const worlds = {};
  async function getNode(nodeId) {
    if (!(nodeId in nodes)) {
      const node = await models.node.findOne({ where: { id: nodeId } });
      const content = node.toJSON().content;
      console.log("got node content from db: ", content);
      nodes[nodeId] = {
        updates: [],
        pending: [],
        doc: import_state.Text.of([content]),
        users: {}
      };
    }
    return nodes[nodeId];
  }
  async function getWorld(worldId) {
    if (!(worldId in worlds)) {
      const nodes2 = await models.node.findAll({ where: { worldId }, order: [["id", "ASC"]] });
      const blocks = {};
      for (let node of nodes2) {
        const { result: response } = await (0, import_interpreterService.interpretGen)(node.content);
        const { blocks: nodeBlocks } = response;
        console.log("for node: ", node.id, " got result: ", response);
        (0, import_blockUtilFns.addNodeToBlocks)(blocks, node.id, node.pos);
        console.log({ blocks });
        (0, import_blockUtilFns.addNewBlocksToBlocks)(blocks, node.id, node.pos, nodeBlocks);
      }
      worlds[worldId] = {
        users: {},
        blocks
      };
    }
    return worlds[worldId];
  }
  io.on("connection", (socket) => {
    console.log("client connected to socket");
    (0, import_world.worldInit)(io, socket, getWorld);
    (0, import_node.nodeInit)(io, socket, getNode, getWorld);
    socket.on("disconnect", () => {
      console.log("client disconnected");
    });
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initSocketService
});
//# sourceMappingURL=index.js.map
