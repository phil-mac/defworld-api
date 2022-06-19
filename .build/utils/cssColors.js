var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
__export(exports, {
  colorToId: () => colorToId
});
const CSS_COLOR_NAMES = [
  "black",
  "white",
  "red",
  "lime",
  "blue",
  "yellow",
  "cyan",
  "aqua",
  "magenta",
  "fuchsia",
  "silver",
  "gray",
  "maroon",
  "olive",
  "green",
  "purple",
  "teal",
  "navy"
];
function colorToId(colorName) {
  return CSS_COLOR_NAMES.indexOf(colorName);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  colorToId
});
//# sourceMappingURL=cssColors.js.map
