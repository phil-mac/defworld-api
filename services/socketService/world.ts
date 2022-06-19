import { addNodeToBlocks, removeNodeFromBlocks } from "../../utils/blockUtilFns";

const { models } = require('../../schema');

function worldInit(io, socket, getWorld) {
  socket.on('joinWorld', async ({name, worldId}) => {
    socket.join(`world-${worldId}`);
    const world = await getWorld(worldId);
    const init = {
      blocksToAdd: world.blocks, 
    }
    socket.emit('initWorldBlocks', init);
    console.log('init world blocks: ', init)
    joinWorld(worldId, name, world);
  });

  function joinWorld(worldId, name, world) {
    const room = `world-${worldId}`;
    socket.emit('initWorldUsers', {users: world.users});

    const user = {username: name, id: 42};
    
    world.users[name] = user;
    console.log(name + ' joined world of id: ' + worldId);

    socket.in(room).emit('userJoined', {user});
    io.in(room).emit('newMessage', {
      message: name + ' joined the world',
      id: Math.floor(Math.random() * 100000),
    });

    socket.on('message', message => {
      io.in(room).emit('newMessage', message);
    });

    socket.on('addNode', addNode);
    async function addNode({pos}:{pos: {x: number, y: number, z: number}}) {
      const scriptNode = await models.node.create({ worldId, pos: [pos.x, pos.y, pos.z] });

      const blocks = world.blocks;
      const nodeToAdd = addNodeToBlocks(blocks, scriptNode.id, [pos.x, pos.y, pos.z]);

      
      // const index = pos.x + (gridSideLength * pos.z) + (gridSideLength * gridSideLength * pos.y);
      // grid[index] = [scriptNode.id, 500];

      io.in(room).emit('blocksUpdate', {blocksToAdd: nodeToAdd});
      
      // await models.world.update({grid}, {where: {id: worldId}});
    }
    
    socket.on('deleteNode', deleteNode);
    async function deleteNode({nodeId}:{nodeId: number}) {
      const returnedNode = await models.node.findOne({ where: { id: nodeId } });
      await models.node.destroy({where: { id: nodeId }});

      // const p = returnedNode.pos;
      // const pos = {x: p[0], y: p[1], z: p[2]};

      let blocks = world.blocks;
      // const index = pos.x + (gridSideLength * pos.z) + (gridSideLength * gridSideLength * pos.y);
      // grid[index] = [0, 0];

      removeNodeFromBlocks(blocks, returnedNode.pos);

      // grid.forEach((el, i) => {
      //   if (el[0] === returnedNode.id) {
      //     grid[i] = [0, 0];
      //   }
      // })

      io.in(room).emit('blocksUpdate', {
        idOfNodeToRemove: returnedNode.id, 
        nodeIdOfBlocksToRemove: returnedNode.id 
      });
      
      // await models.world.update({grid}, {where: {id: worldId}});
    }
    
    socket.on('disconnect', () => {
      socket.in(room).emit('userLeft', {user});
      io.in(room).emit('newMessage', {
        message: name + ' left the world',
        id: Math.floor(Math.random() * 100000),
      });
      delete world.users[name];
    })
  }

}
module.exports = worldInit;