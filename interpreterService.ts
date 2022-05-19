const axios = require('axios');

const interpretGen = (input: string) => new Promise((resolve, reject) =>   {
    axios
      .post('https://gen.phil-mac.repl.co/interpret', {
        input
      })
      .then(res => {
        console.log("asdf", res.data);
        resolve(res.data);
      })
      .catch(e => {
        console.error(e);
        reject(e);
      })
  }
);

exports.interpretGen = interpretGen;