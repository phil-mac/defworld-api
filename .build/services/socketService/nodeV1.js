const { models } = require("../../schema");
function nodeInit(socket, getNode) {
  socket.on("joinNode", async ({ name, nodeId }) => {
    socket.join(`node-${nodeId}`);
    const node = await getNode(nodeId);
    socket.emit("initContent", { content: node.content });
    joinNode(nodeId, node, name);
    socket.in(`node-${nodeId}`).emit("broadcast", name + "joined node " + nodeId);
  });
  socket.on("leaveNode", ({ name, nodeId }) => {
    socket.leave(`node-${nodeId}`);
    socket.in(`node-${nodeId}`).emit("broadcast", name + "left node " + nodeId);
  });
  socket.on("disconnect", () => {
    console.log("client disconnected from socket, for node stuff");
  });
  function joinNode(nodeId, node, name) {
    node.users[socket.id] = { name, selection: { start: 0, end: 0 } };
    socket.on("updateText", (op) => {
      console.log("recieved op: ", op);
      addPendingOp(op);
    });
    function addPendingOp(op) {
      node.pendingOps.push(op);
      const nextOp = node.pendingOps.pop();
      const transformedOp = transformOp(nextOp);
      executeOp(transformedOp);
    }
    function transformOp(op) {
      if (op.rev > node.revLog.length)
        return op;
      const transformingOps = node.revLog.slice(op.rev - 1);
      for (const tOp of transformingOps) {
        if (tOp.pos <= op.pos) {
          op.pos = op.pos + 1;
        }
        op.rev = op.rev + 1;
      }
      console.log("transform into: ", op);
      return op;
    }
    function executeOp(op) {
      node.revLog.push(op);
      console.log("revlog: ", node.revLog);
      applyOp(op);
      acknowledgeOp(op);
      broadcastOp(op);
    }
    function applyOp({ type, pos, text }) {
      node.content = node.content.slice(0, pos) + text + node.content.slice(pos);
      console.log("content: ", node.content);
      models.node.update({ content: node.content }, { where: { id: nodeId } });
      console.log(" ");
    }
    function acknowledgeOp(op) {
      const rev = node.revLog.length;
      socket.emit("opAcknowledged", { ack: rev });
    }
    function broadcastOp(op) {
      socket.in(`node-${nodeId}`).emit("textUpdated", op);
    }
    socket.on("syncSelection", ({ start }) => {
      console.log("sync selection: ", { start });
      node.users[socket.id].selection.start = start;
      console.log("updated users object: ");
      console.log(node.users);
      const { name: name2, selection } = node.users[socket.id];
      socket.in(`node-${nodeId}`).emit("selectionUpdated", { name: name2, selection });
    });
  }
}
module.exports = nodeInit;
//# sourceMappingURL=nodeV1.js.map
