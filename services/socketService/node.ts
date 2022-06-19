import { ChangeSet } from '@codemirror/state';
const { models } = require('../../schema');
import { interpretGen } from '../interpreterService';
import { addNewBlocksToBlocks, removeBlocksFromBlocks } from "../../utils/blockUtilFns";

export function nodeInit(io, socket, getNode, getWorld) {
  socket.on('joinNode', joinNode);

  socket.on('leaveNode', async ({name, nodeId}) => {
    console.log(name + ' left node ' + nodeId)
    socket.leave(`node-${nodeId}`);
    const node = await getNode(nodeId);
    delete node.users[socket.id];
    
    node.pending = []; // TODO: remove this hack - maybe just remove pending items for user who left
   
    socket.removeAllListeners('pullUpdates');
    socket.removeAllListeners('pushUpdates');
    
    socket.in(`node-${nodeId}`).emit('broadcast', name + 'left node ' + nodeId);
  });

  async function joinNode ({name, nodeId}) {
    socket.join(`node-${nodeId}`);
    const node = await getNode(nodeId);
    const init = {
      doc: node.doc.toString(), 
      rev: node.updates.length
    }
    socket.emit('initContent', init);
    console.log(name + ' joined node ' + nodeId)
    node.users[socket.id] = {name};

    socket.on('pullUpdates', pullUpdates);
    
    function pullUpdates({rev}) {
      if (rev < node.updates.length){
        resToPullUpdates(node.updates.slice(rev));
      } else {
        node.pending.push(resToPullUpdates)
      }
    }

    function resToPullUpdates (updates) {
      socket.emit('pullUpdatesRes', updates);
    }

    socket.on('pushUpdates', pushUpdates);

    async function pushUpdates({rev, updates}) {
      const initialDoc = node.doc.toString();
      
      if (rev != node.updates.length) {
        resToPushUpdates(false);
        return;
      }
      
      for (let update of updates) {
        let changes = ChangeSet.fromJSON(update.changes);
        let effects = JSON.parse(update.effects);
        node.updates.push({changes, effects: update.effects, clientId: update.clientID})
        node.doc = changes.apply(node.doc);
      }
      
      resToPushUpdates(true);
      
      while (node.pending.length){
        node.pending.pop()!(updates);
      }

      const newDoc = node.doc.toString();

      if (initialDoc === newDoc) return;
      
      let returnedNode = await models.node.update(
        { content: newDoc },
        { where: { id: nodeId }, returning: true, plain: true}
      );
      returnedNode = returnedNode[1].toJSON();

      await updateWorldGrid({returnedNode, content: newDoc});
    }

    function resToPushUpdates(didSucceed) {
      socket.emit('pushUpdatesRes', didSucceed);
    }

    async function updateWorldGrid({returnedNode, content}) {
      const { result: response } = await interpretGen(content);
      const {result: evalResult, error: evalError, blocks: newBlocks} = response;
     
      const worldId = returnedNode.worldId;
      const world = await getWorld(worldId);
      let blocks = world.blocks;

      // let blocksObj = {};

      removeBlocksFromBlocks(blocks, returnedNode.id);
      const blocksToAdd = addNewBlocksToBlocks(blocks, returnedNode.id, returnedNode.pos, newBlocks);
      
      // blocks.forEach(block => {
      //   const x = returnedNode.pos[0] + block.x;
      //   const y = returnedNode.pos[1] + block.y;
      //   const z = returnedNode.pos[2] + block.z;
      //   const index = x + (gridSideLength * z) + (gridSideLength * gridSideLength * y);

      //   const colorId = !!block.color ? colorToId(block.color) : -1;
      //   console.log({block, colorId})
      //   blocksObj[index] = [returnedNode.id, colorId];
      // });

      // clear grid of old blocks from this node
      // grid.forEach((el, i) => {
      //   if (el[0] === returnedNode.id && el[1] !== 500){
      //     grid[i] = [0, 0];
      //   }
      // })

      // grid.forEach((el, i) => {
      //   let b = blocksObj[i];
      //   if (!!b && grid[i][0] === 0 && grid[i][1] === 0){
      //     grid[i] = b;
      //   }
      // })

      // save grid in server memory 
      // world.grid = grid;
      
      // send new grid to all clients in world
      io.in(`world-${worldId}`).emit('blocksUpdate', {blocksToAdd, nodeIdOfBlocksToRemove: returnedNode.id});
      // send result of eval to clients in this node
      io.in(`node-${returnedNode.id}`).emit('evalResult', {result: evalResult, error: evalError})

      // TODO: for now, saving grid to database, later can just rederive from nodes on initial load
      // await models.world.update({grid}, {where: {id: returnedNode.worldId}});
    }


  }
}