const worldInit = require("./world");
const nodeInit = require("./node");
const init = (io) => {
  const nodes = {};
  function getNode(nodeId) {
    if (!(nodeId in nodes)) {
      nodes[nodeId] = { revLog: [], pendingOps: [], content: "" };
    }
    return nodes[nodeId];
  }
  io.on("connection", (socket) => {
    console.log("client connected to socket");
    worldInit(socket);
    nodeInit(socket, getNode);
  });
};
module.exports = { init };
//# sourceMappingURL=index.js.map
