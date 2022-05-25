function worldInit(socket) {
  const socketWorlds = {};
  socket.on("joinWorld", ({ name, worldId }) => {
    socket.join(`world-${worldId}`);
    socketWorlds[socket.id] = `world-${worldId}`;
    console.log({ socketWorlds });
    socket.in(`world-${worldId}`).emit("broadcast", name + "joined world " + worldId);
  });
  socket.on("message", (data) => {
    console.log("new message: " + data);
    console.log("room: ", socketWorlds[socket.id]);
    io.in(socketWorlds[socket.id]).emit("broadcast", data);
  });
  socket.on("disconnect", () => {
    console.log("client disconnected from socket, for world stuff");
    delete socketWorlds[socket.id];
  });
}
module.exports = worldInit;
//# sourceMappingURL=world.js.map
