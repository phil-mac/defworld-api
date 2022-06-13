const { ChangeSet } = require('@codemirror/state');
const { Update } = require('@codemirror/collab'); 
const { models } = require('../../schema');
const interpreterService = require('../interpreterService');
const { gridSideLength } = require('../../entities/world');

function nodeInit(io, socket, getNode, getWorld) {
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

  // ------- OT logic --------
  
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
      const { result } = await interpreterService.interpretGen(content);
      const evalResult = result.result;
      const blocks = result.blocks; // [{x:1, y:1, z:1}, {x:2, y:2, z:2}]
     
      const worldId = returnedNode.worldId;
      const world = await getWorld(worldId);
      let grid = world.grid;

      let blocksObj = {};
      
      blocks.forEach(block => {
        const x = returnedNode.pos[0] + block.x;
        const y = returnedNode.pos[1] + block.y;
        const z = returnedNode.pos[2] + block.z;
        const index = x + (gridSideLength * z) + (gridSideLength * gridSideLength * y);
        blocksObj[index] = [returnedNode.id, 5];
      });

      // clear grid of old blocks from this node
      grid.forEach((el, i) => {
        if (el[0] === returnedNode.id && el[1] !== 50){
          grid[i] = [0, 0];
        }
      })

      grid.forEach((el, i) => {
        let b = blocksObj[i];
        if (!!b && grid[i][0] === 0 && grid[i][1] === 0){
          grid[i] = b;
        }
      })

      // save grid in server memory 
      world.grid = grid;
      
      // send new grid to all clients in world
      io.in(`world-${worldId}`).emit('gridUpdate', {grid});
      // send result of eval to clients in this node
      io.in(`node-${returnedNode.id}`).emit('evalResult', {result: evalResult})

      // TODO: for now, saving grid to database, later can just rederive from nodes on initial load
      await models.world.update({grid}, {where: {id: returnedNode.worldId}});
    }


  }
}

module.exports = nodeInit;