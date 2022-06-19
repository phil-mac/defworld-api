import { ChangeSet } from '@codemirror/state';
import { models } from '../schema';
import { interpretGen } from '../services/interpreterService';
import { addNewBlocksToBlocks, removeBlocksFromBlocks } from "../utils/blockUtils";
import { Server, Socket } from 'socket.io';

export function nodeInit(
  io: Server,
  socket: Socket,
  getNode: (nodeId: number) => any,
  getWorld: (worldId: number) => any) {
  socket.on('joinNode', joinNode);

  socket.on('leaveNode', async ({ name, nodeId }: { name: string, nodeId: number }) => {
    console.log(name + ' left node ' + nodeId)
    socket.leave(`node-${nodeId}`);
    const node = await getNode(nodeId);
    delete node.users[socket.id];

    node.pending = []; // TODO: remove this hack - maybe just remove pending items for user who left

    socket.removeAllListeners('pullUpdates');
    socket.removeAllListeners('pushUpdates');

    socket.in(`node-${nodeId}`).emit('broadcast', name + 'left node ' + nodeId);
  });

  async function joinNode({ name, nodeId }: { name: string, nodeId: number }) {
    socket.join(`node-${nodeId}`);
    const node = await getNode(nodeId);
    const init = {
      doc: node.doc.toString(),
      rev: node.updates.length
    }
    socket.emit('initContent', init);
    console.log(name + ' joined node ' + nodeId)
    node.users[socket.id] = { name };

    socket.on('pullUpdates', pullUpdates);

    function pullUpdates({ rev }: { rev: number }) {
      if (rev < node.updates.length) {
        resToPullUpdates(node.updates.slice(rev));
      } else {
        node.pending.push(resToPullUpdates)
      }
    }

    function resToPullUpdates(updates: any) {
      socket.emit('pullUpdatesRes', updates);
    }

    socket.on('pushUpdates', pushUpdates);

    async function pushUpdates({ rev, updates }: {rev: number, updates: any}) {
      const initialDoc = node.doc.toString();

      if (rev != node.updates.length) {
        resToPushUpdates(false);
        return;
      }

      for (let update of updates) {
        let changes = ChangeSet.fromJSON(update.changes);
        // let effects = JSON.parse(update.effects);
        node.updates.push({ changes, effects: update.effects, clientId: update.clientID })
        node.doc = changes.apply(node.doc);
      }

      resToPushUpdates(true);

      while (node.pending.length) {
        node.pending.pop()!(updates);
      }

      const newDoc = node.doc.toString();

      if (initialDoc === newDoc) return;

      let returnedNode = await models.node.update(
        { content: newDoc },
        { where: { id: nodeId }, returning: true, plain: true }
      );
      returnedNode = returnedNode[1].toJSON();

      await updateWorldGrid({ returnedNode, content: newDoc });
    }

    function resToPushUpdates(didSucceed: boolean) {
      socket.emit('pushUpdatesRes', didSucceed);
    }

    async function updateWorldGrid({ returnedNode, content } : {returnedNode: any, content: string}) {
      const { result: evalResult, error: evalError, blocks: newBlocks } = await interpretGen(content);

      const worldId = returnedNode.worldId;
      const world = await getWorld(worldId);
      let blocks = world.blocks;

      removeBlocksFromBlocks(blocks, returnedNode.id);
      const blocksToAdd = addNewBlocksToBlocks(blocks, returnedNode.id, returnedNode.pos, newBlocks);

      // send new grid to all clients in world
      io.in(`world-${worldId}`).emit('blocksUpdate', { blocksToAdd, nodeIdOfBlocksToRemove: returnedNode.id });
      
      // send result of eval to clients in this node
      io.in(`node-${returnedNode.id}`).emit('evalResult', { result: evalResult, error: evalError })
    }
  }
}