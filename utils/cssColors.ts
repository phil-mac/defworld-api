const CSS_COLOR_NAMES = [
  'black',
  'white',
  'red',
  'lime',
  'blue',
  'yellow',
  'cyan',
  'aqua',
  'magenta',
  'fuchsia',
  'silver',
  'gray',
  'maroon',
  'olive',
  'green',
  'purple',
  'teal',
  'navy',
];

export function colorToId(colorName: string) {
  return CSS_COLOR_NAMES.indexOf(colorName);
}