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
  worldInit: () => worldInit
});
var import_blockUtils = __toModule(require("../utils/blockUtils"));
var import_schema = __toModule(require("../schema"));
function worldInit(io, socket, getWorld) {
  socket.on("joinWorld", async ({ name, worldId }) => {
    socket.join(`world-${worldId}`);
    const world = await getWorld(worldId);
    const init = {
      blocksToAdd: world.blocks
    };
    socket.emit("initWorldBlocks", init);
    console.log("init world blocks: ", init);
    joinWorld(worldId, name, world);
  });
  function joinWorld(worldId, name, world) {
    const room = `world-${worldId}`;
    socket.emit("initWorldUsers", { users: world.users });
    const user = { username: name, id: 42 };
    world.users[name] = user;
    console.log(name + " joined world of id: " + worldId);
    socket.in(room).emit("userJoined", { user });
    io.in(room).emit("newMessage", {
      message: name + " joined the world",
      id: Math.floor(Math.random() * 1e5)
    });
    socket.on("message", (message) => {
      io.in(room).emit("newMessage", message);
    });
    socket.on("addNode", addNode);
    async function addNode({ pos }) {
      const scriptNode = await import_schema.models.node.create({ worldId, pos: [pos.x, pos.y, pos.z] });
      const blocks = world.blocks;
      const nodeToAdd = (0, import_blockUtils.addNodeToBlocks)(blocks, scriptNode.id, [pos.x, pos.y, pos.z]);
      io.in(room).emit("blocksUpdate", { blocksToAdd: nodeToAdd });
    }
    socket.on("deleteNode", deleteNode);
    async function deleteNode({ nodeId }) {
      const returnedNode = await import_schema.models.node.findOne({ where: { id: nodeId } });
      await import_schema.models.node.destroy({ where: { id: nodeId } });
      let blocks = world.blocks;
      (0, import_blockUtils.removeNodeFromBlocks)(blocks, returnedNode.pos);
      io.in(room).emit("blocksUpdate", {
        idOfNodeToRemove: returnedNode.id,
        nodeIdOfBlocksToRemove: returnedNode.id
      });
    }
    socket.on("disconnect", () => {
      socket.in(room).emit("userLeft", { user });
      io.in(room).emit("newMessage", {
        message: name + " left the world",
        id: Math.floor(Math.random() * 1e5)
      });
      delete world.users[name];
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  worldInit
});
//# sourceMappingURL=world.js.map
