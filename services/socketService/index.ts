const { Text } = require('@codemirror/state');
const nodeInit = require('./node');
const worldInit = require('./world');
const { models } = require('../../schema');

const init = (io) => {
  const nodes = {};
  const worlds = {};

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
        users: {}
      };
    }
    
    return nodes[nodeId];
  }

  async function getWorld (worldId) {
    if (!(worldId in worlds)) {
      const world = await models.world.findOne({ where: { id: worldId }});
      const grid = world.toJSON().grid; 
      
      worlds[worldId] = {
         users: {},
         grid
       }
    }
    return worlds[worldId];
  }
  
  io.on('connection', socket => {
    console.log('client connected to socket');

    worldInit(io, socket, getWorld);
    nodeInit(io, socket, getNode, getWorld);

    socket.on('disconnect', () => {
      console.log('client disconnected')
    })
  });
};

module.exports = { init };