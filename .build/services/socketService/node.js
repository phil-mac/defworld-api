function nodeInit(socket, getNode) {
  const nodeRooms = {};
  socket.on("joinNode", ({ name, nodeId }) => {
    socket.join(`node-${nodeId}`);
    nodeRooms[socket.id] = `node-${nodeId}`;
    const node = getNode(nodeId);
    joinNode(nodeId, node);
    socket.in(`node-${nodeId}`).emit("broadcast", name + "joined node " + nodeId);
  });
  socket.on("leaveNode", ({ name, nodeId }) => {
    socket.leave(`node-${nodeId}`);
    delete nodeRooms[socket.id];
    socket.in(`node-${nodeId}`).emit("broadcast", name + "left node " + nodeId);
  });
  socket.on("disconnect", () => {
    console.log("client disconnected from socket, for node stuff");
    delete nodeRooms[socket.id];
  });
  function joinNode(nodeId, node) {
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
      console.log(" ");
    }
    function acknowledgeOp(op) {
      const rev = node.revLog.length;
      socket.emit("opAcknowledged", { ack: rev });
    }
    function broadcastOp(op) {
      socket.in(nodeRooms[socket.id]).emit("textUpdated", op);
    }
  }
}
module.exports = nodeInit;
//# sourceMappingURL=node.js.map
