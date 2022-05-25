function nodeInit(socket, getNode) {
  const nodeRooms = {};
  // const revLog = [];
  // const pendingOps = [];
  // let content = '';

  socket.on('joinNode', ({name, nodeId}) => {
    socket.join(`node-${nodeId}`);
    nodeRooms[socket.id] = `node-${nodeId}`;
    
    const node = getNode(nodeId);
    joinNode(nodeId, node);
    
    socket.in(`node-${nodeId}`).emit('broadcast', name + 'joined node ' + nodeId);
  });

  socket.on('leaveNode', ({name, nodeId}) => {
    socket.leave(`node-${nodeId}`);
    delete nodeRooms[socket.id];
    
    socket.in(`node-${nodeId}`).emit('broadcast', name + 'left node ' + nodeId);
  });

  socket.on('disconnect', () => {
    console.log('client disconnected from socket, for node stuff')
    delete nodeRooms[socket.id];
  });

  
  function joinNode (nodeId, node) {
    socket.on('updateText', (op) => {
      console.log('recieved op: ', op)
  
      const {type, pos, text, rev} = op;
  
      addPendingOp(op);    
    });

    function addPendingOp(op) {
      node.pendingOps.push(op);
  
      // for not just execute them right after adding them
      const nextOp = node.pendingOps.pop();
      
      executeOp(nextOp);
    }
  
    function executeOp(op) {
      applyOp(op);
      broadcastOp(op);
      node.revLog.push(op);
      console.log('revlog: ', node.revLog)
    }
  
    function applyOp({type, pos, text}) {
      node.content = node.content.slice(0, pos) + text + node.content.slice(pos);
      console.log('content: ', node.content);
    }
    
    function broadcastOp(op) {
      socket.in(nodeRooms[socket.id]).emit('textUpdated', op);
    }
  }
}

module.exports = nodeInit;