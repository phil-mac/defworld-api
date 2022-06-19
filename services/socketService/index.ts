const { Text } = require('@codemirror/state');
const nodeInit = require('./node');
const worldInit = require('./world');
const interpreterService = require('../interpreterService');
const { models } = require('../../schema');
import { addNewBlocksToBlocks, addNodeToBlocks } from "../../utils/blockUtilFns";

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
      // const world = await models.world.findOne({ where: { id: worldId }});
      // const grid = world.toJSON().grid; 

      const nodes = await models.node.findAll({ where: { worldId }, order: [['id', 'ASC']] });
      const blocks = {};

      for (let node of nodes) {
        const { result: response } = await interpreterService.interpretGen(node.content);
        const  { blocks: nodeBlocks } = response; // {x: number, y: number, z: number, color: string}[]
        console.log('for node: ', node.id, ' got result: ', response)

        // console.log({node})

        // add node and nodeBlocks to Blocks object
        addNodeToBlocks(blocks, node.id, node.pos);
        console.log({blocks})
        addNewBlocksToBlocks(blocks, node.id, node.pos, nodeBlocks)
      }

      
      worlds[worldId] = {
        users: {},
        blocks // object, excludes empties, index explicit:  {2: [1,500], 4: [1,8]]
        // grid, // array, includes empties, index implicit:   [[0,0],[0,0],[1,500],[0,0],[1,8],[0,0],[0,0],[0,0]]
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