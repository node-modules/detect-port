# detect-port

[![NPM version][npm-image]][npm-url]
[![CI](https://github.com/node-modules/detect-port/actions/workflows/nodejs.yml/badge.svg)](https://github.com/node-modules/detect-port/actions/workflows/nodejs.yml)
[![Test coverage][codecov-image]][codecov-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]
[![Node.js Version][node-version-image]][node-version-url]

[npm-image]: https://img.shields.io/npm/v/detect-port.svg?style=flat-square
[npm-url]: https://npmjs.org/package/detect-port
[codecov-image]: https://codecov.io/gh/node-modules/detect-port/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/detect-port
[snyk-image]: https://snyk.io/test/npm/detect-port/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/detect-port
[download-image]: https://img.shields.io/npm/dm/detect-port.svg?style=flat-square
[download-url]: https://npmjs.org/package/detect-port
[node-version-image]: https://img.shields.io/node/v/detect-port.svg?style=flat-square
[node-version-url]: https://nodejs.org/en/download/

> Node.js implementation of port detector

## Who are using or has used

- ⭐⭐⭐[eggjs/egg](//github.com/eggjs/egg)
- ⭐⭐⭐[alibaba/ice](//github.com/alibaba/ice)
- ⭐⭐⭐[alibaba/uirecorder](//github.com/alibaba/uirecorder)
- ⭐⭐⭐[facebook/create-react-app](//github.com/facebook/create-react-app/blob/main/packages/react-dev-utils/package.json)
- ⭐⭐⭐[facebook/flipper](//github.com/facebook/flipper)
- ⭐⭐⭐[umijs/umi](//github.com/umijs/umi)
- ⭐⭐⭐[gatsbyjs/gatsby](//github.com/gatsbyjs/gatsby)
- ⭐⭐⭐[electron-react-boilerplate/electron-react-boilerplate](//github.com/electron-react-boilerplate/electron-react-boilerplate)
- ⭐⭐⭐[zeit/micro](//github.com/zeit/micro)
- ⭐⭐⭐[rails/webpacker](//github.com/rails/webpacker)
- ⭐⭐⭐[storybookjs/storybook](//github.com/storybookjs/storybook)

[For more](//github.com/node-modules/detect-port/network/dependents)

## Usage

```bash
npm i detect-port
```

CommonJS

```javascript
const { detect } = require('detect-port');

detect(port)
  .then(realPort => {
    if (port == realPort) {
      console.log(`port: ${port} was not occupied`);
    } else {
      console.log(`port: ${port} was occupied, try port: ${realPort}`);
    }
  })
  .catch(err => {
    console.log(err);
  });
```

ESM and TypeScript

```ts
import { detect } from 'detect-port';

detect(port)
  .then(realPort => {
    if (port == realPort) {
      console.log(`port: ${port} was not occupied`);
    } else {
      console.log(`port: ${port} was occupied, try port: ${realPort}`);
    }
  })
  .catch(err => {
    console.log(err);
  });
```

## Command Line Tool

```bash
npm i detect-port -g
```

### Quick Start

```bash
# get an available port randomly
$ detect

# detect pointed port
$ detect 80

# output verbose log
$ detect --verbose

# more help
$ detect --help
```

## FAQ

Most likely network error, check that your `/etc/hosts` and make sure the content below:

```bash
127.0.0.1       localhost
255.255.255.255 broadcasthost
::1             localhost
```

## License

[MIT](LICENSE)

## Contributors

[![Contributors](https://contrib.rocks/image?repo=node-modules/detect-port)](https://github.com/node-modules/detect-port/graphs/contributors)

Made with [contributors-img](https://contrib.rocks).
