import { createServer } from 'node:http';
import { hostname } from 'node:os';

const server = createServer();

server.listen(7001, hostname(), () => {
  console.log('listening %s:7001, address: %o', hostname(), server.address());
});
