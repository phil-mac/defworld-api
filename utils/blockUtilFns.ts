import { colorToId } from "./cssColors";

export const gridSideLength = 64;

export function indexFromCoords([x, y, z]: number[]) {
  console.log({gridSideLength})
  return x + (gridSideLength * z) + (gridSideLength * gridSideLength * y);
}

export function addNodeToBlocks (blocks: Record<number, {}>, nodeId: number, pos: number[]) {
  const nodeIndex = indexFromCoords(pos);
  console.log({nodeIndex})
  blocks[nodeIndex] = [nodeId, 500];
  const blocksToAdd = {};
  blocksToAdd[nodeIndex] = [nodeId, 500];
  return blocksToAdd;
}

export function addNewBlocksToBlocks (
  blocks: Record<number, {}>, 
  nodeId: number,
  nodePos: number[],
  newBlocks: {x: number, y: number, z: number, color: string}[]
) {
  const addedBlocks = {};
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
  blocks: Record<number, {}>, 
  nodeIdOfBlocksToRemove: number
) {
  for (let index in blocks) {
    if (blocks[index][0] === nodeIdOfBlocksToRemove && blocks[index][1] !== 500) {
      delete blocks[index];
    }
  }
}

export function removeNodeFromBlocks (blocks: Record<number, {}>, nodePos: number[],) {
  const nodeIndex = indexFromCoords(nodePos);
  delete blocks[nodeIndex];
}