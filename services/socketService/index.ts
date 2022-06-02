const { Text } = require('@codemirror/state');
const nodeInit = require('./node');
const worldInit = require('./world');
const { models } = require('../../schema');

const init = (io) => {
  const nodes = {};

  async function getNode (nodeId) {
    if (!(nodeId in nodes)) {
      // get content from database
      
      const node = await models.node.findOne({ where: { id: nodeId } });

      const content = node.toJSON().content;

      console.log("got node content from db: ", content);
    
      nodes[nodeId] = { 
        updates: [], 
        pending: [],
        doc: Text.of([content]),
        // doc: Text.of(['']),
        users: {}
      };
    }
    
    return nodes[nodeId];
  }
  
  io.on('connection', socket => {
    socket.emit('ack', 'Welcome to the socket, client.')
    console.log('client connected to socket');

    worldInit(socket);
    nodeInit(socket, getNode);

    socket.on('disconnect', () => {
      console.log('client disconnected')
    })
  });
};

module.exports = { init };