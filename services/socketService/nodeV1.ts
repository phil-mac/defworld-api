// NOTE:
// code from aborted attempt to make OT system from scratch
// switched to using Codemirror 6 Collab module.

// in parent:
// const nodes = {};

//   async function getNode (nodeId) {
//     if (!(nodeId in nodes)) {
//       // get content from database
      
//       const node = await models.node.findOne({ where: { id: nodeId } });

//       const content = node.toJSON().content;

//       console.log("got node content from db: ", content);
    
//       nodes[nodeId] = { 
//         revLog: [], 
//         pendingOps: [], 
//         users: {},
//         content 
//       };
//     }
    
//     return nodes[nodeId];
//   }

const {models} = require('../../schema');

function nodeInit(socket, getNode) {
  // const nodeRooms = {};

  socket.on('joinNode', async ({name, nodeId}) => {
    socket.join(`node-${nodeId}`);
    // nodeRooms[socket.id] = `node-${nodeId}`;
    
    const node = await getNode(nodeId);
    socket.emit('initContent', {content: node.content});
    joinNode(nodeId, node, name);
    
    socket.in(`node-${nodeId}`).emit('broadcast', name + 'joined node ' + nodeId);
  });

  socket.on('leaveNode', ({name, nodeId}) => {
    socket.leave(`node-${nodeId}`);
    // delete nodeRooms[socket.id];
    
    socket.in(`node-${nodeId}`).emit('broadcast', name + 'left node ' + nodeId);
  });

  socket.on('disconnect', () => {
    console.log('client disconnected from socket, for node stuff')
    // delete nodeRooms[socket.id];
  });

  // ------- OT logic --------
  
  function joinNode (nodeId, node, name) {
    node.users[socket.id] = {name, selection: { start: 0, end: 0}};
    
    socket.on('updateText', (op) => {
      console.log('recieved op: ', op)
  
      addPendingOp(op);    
    });

    function addPendingOp(op) {
      node.pendingOps.push(op);
  
      // for now, just execute them right after adding them
      const nextOp = node.pendingOps.pop();

      const transformedOp = transformOp(nextOp);
      
      executeOp(transformedOp);
    }

    // content:  xabc
    // latest rev:  4
    // revlog:  [
    //   { type: 'add', pos: 0, text: 'a', rev: 1 },
    //   { type: 'add', pos: 1, text: 'b', rev: 2 },
    //   { type: 'add', pos: 2, text: 'c', rev: 3 },
    //   { type: 'add', pos: 0, text: 'x', rev: 4 }
    // ]

    //   { type: 'add', pos: 0, text: 'a', rev: 1 },
    //   { type: 'add', pos: 0, text: 'b', rev: 1 },
    //      => pos 1, rev 2

    //   { type: 'add', pos: 0, text: 'a', rev: 1 },
    //   { type: 'add', pos: 1, text: 'b', rev: 2 },
    //   { type: 'add', pos: 1, text: 'x', rev: 2 },
    //      => pos 2, rev 3

    //   { type: 'add', pos: 0, text: 'a', rev: 1 },
    //   { type: 'add', pos: 1, text: 'b', rev: 2 },''
    //   { type: 'add', pos: 0, text: 'x', rev: 2 },
    //      => pos 0, rev 3
    
    function transformOp(op) {
      if (op.rev > node.revLog.length) return op;

      const transformingOps = node.revLog.slice(op.rev - 1);

      for (const tOp of transformingOps) {
        if (tOp.pos <= op.pos) {
          op.pos = op.pos + 1;
        }
        op.rev = op.rev + 1;
      }
      
      console.log('transform into: ', op);
      return op;
    }
  
    function executeOp(op) {
      node.revLog.push(op);
      console.log('revlog: ', node.revLog)

      applyOp(op);
      acknowledgeOp(op);
      broadcastOp(op);
    }
  
    function applyOp({type, pos, text}) {
      node.content = node.content.slice(0, pos) + text + node.content.slice(pos);
      console.log('content: ', node.content);
      models.node.update(
        { content: node.content },
        { where: { id: nodeId }}
      );
      console.log(' ')
    }

    function acknowledgeOp(op) {
      const rev = node.revLog.length;
      // console.log('latest rev: ', rev)
      socket.emit('opAcknowledged', {ack: rev});
    }
    
    function broadcastOp(op) {
      socket.in(`node-${nodeId}`).emit('textUpdated', op);
    }

    // --- sync selections ---

    socket.on('syncSelection', ({start}) => {
      console.log('sync selection: ', {start})
      node.users[socket.id].selection.start = start;
      console.log("updated users object: ")
      console.log(node.users)

      const {name, selection} = node.users[socket.id];
      socket.in(`node-${nodeId}`).emit('selectionUpdated', {name, selection })
    })
  }
}

module.exports = nodeInit;