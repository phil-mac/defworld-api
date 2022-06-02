const { ChangeSet } = require('@codemirror/state');
const { Update } = require('@codemirror/collab'); 
const { models } = require('../../schema');

function nodeInit(socket, getNode) {
  socket.on('joinNode', async ({name, nodeId}) => {
    socket.join(`node-${nodeId}`);
    const node = await getNode(nodeId);
    const init = {
      doc: node.doc.toString(), 
      rev: node.updates.length
    }
    socket.emit('initContent', init);
    joinNode(nodeId, node, name);
    
    socket.in(`node-${nodeId}`).emit('broadcast', name + 'joined node ' + nodeId);
  });

  socket.on('leaveNode', ({name, nodeId}) => {
    socket.leave(`node-${nodeId}`);
    socket.in(`node-${nodeId}`).emit('broadcast', name + 'left node ' + nodeId);
  });

  socket.on('disconnect', () => {
    console.log('client disconnected from socket, for node stuff')
  });

  // ------- OT logic --------
  
  function joinNode (nodeId, node, name) {
    node.users[socket.id] = {name};

    console.log(`user ${name} joined node ${nodeId}`);

    socket.on('pullUpdates', ({rev}) => {
      if (rev < node.updates.length){
        resToPullUpdates(node.updates.slice(rev));
      } else {
        node.pending.push(resToPullUpdates)
      }
    });
    
    function resToPullUpdates (updates) {
      socket.emit('pullUpdatesRes', updates);
    }

    socket.on('pushUpdates', ({rev, updates}) => {
      if (rev != node.updates.length) {
        resToPushUpdates(false);
      } else {
        for (let update of updates) {
          let changes = ChangeSet.fromJSON(update.changes);
          let effects = JSON.parse(update.effects);
          console.log("EFFECTS: ", effects);
          node.updates.push({changes, effects: update.effects, clientId: update.clientID})
          node.doc = changes.apply(node.doc);
          models.node.update(
            { content: node.doc.toString() },
            { where: { id: nodeId }}
          );
        }
        resToPushUpdates(true);
        while (node.pending.length){
          node.pending.pop()!(updates);
        }
      }
    });

    function resToPushUpdates(didSucceed) {
      socket.emit('pushUpdatesRes', didSucceed);
    }
  }
}

module.exports = nodeInit;