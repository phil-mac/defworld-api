import { GenBlock } from "../services/interpreterService";
import { colorToId } from "./cssColors";

export const gridSideLength = 64;

export type Block = [number, number];
export type BlocksObj = Record<number, Block>;
export type Coords = [number, number, number];

export function indexFromCoords([x, y, z]: Coords) {
  return x + (gridSideLength * z) + (gridSideLength * gridSideLength * y);
}

export function addNodeToBlocks(blocks: BlocksObj, nodeId: number, pos: Coords) {
  const nodeIndex = indexFromCoords(pos);
  blocks[nodeIndex] = [nodeId, 500];
  const blocksToAdd: BlocksObj = {};
  blocksToAdd[nodeIndex] = [nodeId, 500];
  return blocksToAdd;
}

export function addNewBlocksToBlocks(
  blocks: Record<number, {}>,
  nodeId: number,
  nodePos: number[],
  newBlocks: GenBlock[]
) {
  const addedBlocks: BlocksObj = {};
  newBlocks.forEach(block => {
    const x = nodePos[0] + block.x;
    const y = nodePos[1] + block.y;
    const z = nodePos[2] + block.z;
    const index = indexFromCoords([x, y, z]);

    const colorId = !!block.color ? colorToId(block.color) : -1;
    if (!blocks[index]) {
      blocks[index] = [nodeId, colorId];
      addedBlocks[index] = [nodeId, colorId];
    }
  });
  return addedBlocks;
}

export function removeBlocksFromBlocks(
  blocks: BlocksObj,
  nodeIdOfBlocksToRemove: number
) {
  for (let index in blocks) {
    if (blocks[index][0] === nodeIdOfBlocksToRemove && blocks[index][1] !== 500) {
      delete blocks[index];
    }
  }
}

export function removeNodeFromBlocks(blocks: BlocksObj, nodePos: Coords,) {
  const nodeIndex = indexFromCoords(nodePos);
  delete blocks[nodeIndex];
}