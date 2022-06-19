import { Server, Socket } from 'socket.io';
import { addNodeToBlocks, removeNodeFromBlocks } from "../utils/blockUtils";
import { models } from '../schema';

export function worldInit(io: Server, socket: Socket, getWorld: any) {
  socket.on('joinWorld', async ({ name, worldId }) => {
    socket.join(`world-${worldId}`);
    const world = await getWorld(worldId);
    const init = {
      blocksToAdd: world.blocks,
    }
    socket.emit('initWorldBlocks', init);
    console.log('init world blocks: ', init)
    joinWorld(worldId, name, world);
  });

  function joinWorld(worldId: string, name: string, world: any) {
    const room = `world-${worldId}`;
    socket.emit('initWorldUsers', { users: world.users });

    const user = { username: name, id: 42 };

    world.users[name] = user;
    console.log(name + ' joined world of id: ' + worldId);

    socket.in(room).emit('userJoined', { user });
    io.in(room).emit('newMessage', {
      message: name + ' joined the world',
      id: Math.floor(Math.random() * 100000),
    });

    socket.on('message', message => {
      io.in(room).emit('newMessage', message);
    });

    socket.on('addNode', addNode);
    async function addNode({ pos }: { pos: { x: number, y: number, z: number } }) {
      const scriptNode = await models.node.create({ worldId, pos: [pos.x, pos.y, pos.z] });

      const blocks = world.blocks;
      const nodeToAdd = addNodeToBlocks(blocks, scriptNode.id, [pos.x, pos.y, pos.z]);

      io.in(room).emit('blocksUpdate', { blocksToAdd: nodeToAdd });
    }

    socket.on('deleteNode', deleteNode);
    async function deleteNode({ nodeId }: { nodeId: number }) {
      const returnedNode = await models.node.findOne({ where: { id: nodeId } });
      await models.node.destroy({ where: { id: nodeId } });

      let blocks = world.blocks;
      removeNodeFromBlocks(blocks, returnedNode.pos);

      io.in(room).emit('blocksUpdate', {
        idOfNodeToRemove: returnedNode.id,
        nodeIdOfBlocksToRemove: returnedNode.id
      });
    }

    socket.on('disconnect', () => {
      socket.in(room).emit('userLeft', { user });
      io.in(room).emit('newMessage', {
        message: name + ' left the world',
        id: Math.floor(Math.random() * 100000),
      });
      delete world.users[name];
    })
  }

}