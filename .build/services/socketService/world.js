function worldInit(io, socket, getWorld) {
  socket.on("joinWorld", async ({ name, worldId }) => {
    socket.join(`world-${worldId}`);
    const world = await getWorld(worldId);
    const init = {
      grid: world.grid
    };
    socket.emit("initWorldGrid", init);
    joinWorld(worldId, name, world);
  });
  function joinWorld(worldId, name, world) {
    const room = `world-${worldId}`;
    socket.emit("initWorldUsers", { users: world.users });
    const user = { username: name, id: 42 };
    world.users[name] = user;
    console.log(name + " joined world of id: " + worldId);
    console.log("user list: ", world.users);
    socket.in(room).emit("userJoined", { user });
    io.in(room).emit("newMessage", {
      message: name + " joined the world",
      id: Math.floor(Math.random() * 1e5)
    });
    socket.on("message", (message) => {
      console.log("new message: " + message);
      io.in(room).emit("newMessage", message);
    });
    socket.on("disconnect", () => {
      console.log('client "' + name + '" disconnected from socket, for world stuff');
      console.log({ user });
      socket.in(room).emit("userLeft", { user });
      io.in(room).emit("newMessage", {
        message: name + " left the world",
        id: Math.floor(Math.random() * 1e5)
      });
      delete world.users[name];
      console.log("user list: ", world.users);
    });
  }
}
module.exports = worldInit;
//# sourceMappingURL=world.js.map
