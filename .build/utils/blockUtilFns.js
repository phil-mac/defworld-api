var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  addNewBlocksToBlocks: () => addNewBlocksToBlocks,
  addNodeToBlocks: () => addNodeToBlocks,
  gridSideLength: () => gridSideLength,
  indexFromCoords: () => indexFromCoords,
  removeBlocksFromBlocks: () => removeBlocksFromBlocks,
  removeNodeFromBlocks: () => removeNodeFromBlocks
});
var import_cssColors = __toModule(require("./cssColors"));
const gridSideLength = 64;
function indexFromCoords([x, y, z]) {
  console.log({ gridSideLength });
  return x + gridSideLength * z + gridSideLength * gridSideLength * y;
}
function addNodeToBlocks(blocks, nodeId, pos) {
  const nodeIndex = indexFromCoords(pos);
  console.log({ nodeIndex });
  blocks[nodeIndex] = [nodeId, 500];
  const blocksToAdd = {};
  blocksToAdd[nodeIndex] = [nodeId, 500];
  return blocksToAdd;
}
function addNewBlocksToBlocks(blocks, nodeId, nodePos, newBlocks) {
  const addedBlocks = {};
  newBlocks.forEach((block) => {
    const x = nodePos[0] + block.x;
    const y = nodePos[1] + block.y;
    const z = nodePos[2] + block.z;
    const index = indexFromCoords([x, y, z]);
    const colorId = !!block.color ? (0, import_cssColors.colorToId)(block.color) : -1;
    if (!blocks[index]) {
      blocks[index] = [nodeId, colorId];
      addedBlocks[index] = [nodeId, colorId];
    }
  });
  return addedBlocks;
}
function removeBlocksFromBlocks(blocks, nodeIdOfBlocksToRemove) {
  for (let index in blocks) {
    if (blocks[index][0] === nodeIdOfBlocksToRemove && blocks[index][1] !== 500) {
      delete blocks[index];
    }
  }
}
function removeNodeFromBlocks(blocks, nodePos) {
  const nodeIndex = indexFromCoords(nodePos);
  delete blocks[nodeIndex];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addNewBlocksToBlocks,
  addNodeToBlocks,
  gridSideLength,
  indexFromCoords,
  removeBlocksFromBlocks,
  removeNodeFromBlocks
});
//# sourceMappingURL=blockUtilFns.js.map
