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
var import_blockUtilFns = __toModule(require("../../utils/blockUtilFns"));
const { ChangeSet } = require("@codemirror/state");
const { models } = require("../../schema");
const interpreterService = require("../interpreterService");
function nodeInit(io, socket, getNode, getWorld) {
  socket.on("joinNode", joinNode);
  socket.on("leaveNode", async ({ name, nodeId }) => {
    console.log(name + " left node " + nodeId);
    socket.leave(`node-${nodeId}`);
    const node = await getNode(nodeId);
    delete node.users[socket.id];
    node.pending = [];
    socket.removeAllListeners("pullUpdates");
    socket.removeAllListeners("pushUpdates");
    socket.in(`node-${nodeId}`).emit("broadcast", name + "left node " + nodeId);
  });
  async function joinNode({ name, nodeId }) {
    socket.join(`node-${nodeId}`);
    const node = await getNode(nodeId);
    const init = {
      doc: node.doc.toString(),
      rev: node.updates.length
    };
    socket.emit("initContent", init);
    console.log(name + " joined node " + nodeId);
    node.users[socket.id] = { name };
    socket.on("pullUpdates", pullUpdates);
    function pullUpdates({ rev }) {
      if (rev < node.updates.length) {
        resToPullUpdates(node.updates.slice(rev));
      } else {
        node.pending.push(resToPullUpdates);
      }
    }
    function resToPullUpdates(updates) {
      socket.emit("pullUpdatesRes", updates);
    }
    socket.on("pushUpdates", pushUpdates);
    async function pushUpdates({ rev, updates }) {
      const initialDoc = node.doc.toString();
      if (rev != node.updates.length) {
        resToPushUpdates(false);
        return;
      }
      for (let update of updates) {
        let changes = ChangeSet.fromJSON(update.changes);
        let effects = JSON.parse(update.effects);
        node.updates.push({ changes, effects: update.effects, clientId: update.clientID });
        node.doc = changes.apply(node.doc);
      }
      resToPushUpdates(true);
      while (node.pending.length) {
        node.pending.pop()(updates);
      }
      const newDoc = node.doc.toString();
      if (initialDoc === newDoc)
        return;
      let returnedNode = await models.node.update({ content: newDoc }, { where: { id: nodeId }, returning: true, plain: true });
      returnedNode = returnedNode[1].toJSON();
      await updateWorldGrid({ returnedNode, content: newDoc });
    }
    function resToPushUpdates(didSucceed) {
      socket.emit("pushUpdatesRes", didSucceed);
    }
    async function updateWorldGrid({ returnedNode, content }) {
      const { result: response } = await interpreterService.interpretGen(content);
      const { result: evalResult, error: evalError, blocks: newBlocks } = response;
      const worldId = returnedNode.worldId;
      const world = await getWorld(worldId);
      let blocks = world.blocks;
      (0, import_blockUtilFns.removeBlocksFromBlocks)(blocks, returnedNode.id);
      const blocksToAdd = (0, import_blockUtilFns.addNewBlocksToBlocks)(blocks, returnedNode.id, returnedNode.pos, newBlocks);
      io.in(`world-${worldId}`).emit("blocksUpdate", { blocksToAdd, nodeIdOfBlocksToRemove: returnedNode.id });
      io.in(`node-${returnedNode.id}`).emit("evalResult", { result: evalResult, error: evalError });
    }
  }
}
module.exports = nodeInit;
//# sourceMappingURL=node.js.map
