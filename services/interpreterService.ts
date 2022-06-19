import axios from 'axios';

export const interpretGen = (input: string) => new Promise((resolve, reject) =>   {
    axios
      .post('https://gen.phil-mac.repl.co/interpret', {
        input
      })
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        console.error(e);
        reject(e);
      })
  }
);