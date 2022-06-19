import axios from 'axios';

export type GenBlock = {
  x: number;
  y: number;
  z: number;
  color?: string;
}

export type GenResponse = {
  result: string,
  error: string,
  blocks: GenBlock[];
}

export const interpretGen = (input: string) : Promise<GenResponse> => new Promise((resolve, reject) => {
  axios
    .post('https://gen.phil-mac.repl.co/interpret', {
      input
    })
    .then(res => {
      resolve(res.data.result);
    })
    .catch(e => {
      console.error(e);
      reject(e);
    })
}
);