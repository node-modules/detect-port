import { detect } from '../../dist/esm/index.js';

detect(7001)
  .then(port => {
    console.log(port);
  })
  .catch(err => {
    console.error(err);
  });
