import { Text } from '@codemirror/state';
import { nodeInit } from './node';
import { worldInit } from './world';
import { interpretGen } from '../services/interpreterService';
import { models } from '../schema';
import { addNewBlocksToBlocks, addNodeToBlocks, BlocksObj } from "../utils/blockUtils";
import { Server } from 'socket.io';

export const initSocketService = (io: Server) => {
  const nodes: Record<any, any> = {};
  const worlds: Record<any, any> = {};

  async function getNode(nodeId: number) {
    if (!(nodeId in nodes)) {
      const node = await models.node.findOne({ where: { id: nodeId } });

      const content = node.toJSON().content;

      nodes[nodeId] = {
        updates: [],
        pending: [],
        doc: Text.of([content]),
        users: {}
      };
    }
    
    return nodes[nodeId];
  }

  async function getWorld(worldId: number) {
    if (!(worldId in worlds)) {
      const nodes = await models.node.findAll({ where: { worldId }, order: [['id', 'ASC']] });
      const blocks: BlocksObj = {};

      for (let node of nodes) {
        const { blocks: nodeBlocks } = await interpretGen(node.content);

        addNodeToBlocks(blocks, node.id, node.pos);
        addNewBlocksToBlocks(blocks, node.id, node.pos, nodeBlocks)
      }

      worlds[worldId] = {
        users: {},
        blocks // example: {2: [1,500], 4: [1,8]]
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