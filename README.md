detect-port
===========

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]
[![David deps][david-image]][david-url]
[![node version][node-image]][node-url]

[npm-image]: https://img.shields.io/npm/v/detect-port.svg?style=flat-square
[npm-url]: https://npmjs.org/package/detect-port
[travis-image]: https://img.shields.io/travis/xudafeng/detect-port.svg?style=flat-square
[travis-url]: https://travis-ci.org/xudafeng/detect-port
[coveralls-image]: https://img.shields.io/coveralls/xudafeng/detect-port.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/xudafeng/detect-port?branch=master
[david-image]: https://img.shields.io/david/xudafeng/detect-port.svg?style=flat-square
[david-url]: https://david-dm.org/xudafeng/detect-port
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11.14-red.svg?style=flat-square
[node-url]: http://nodejs.org/download/

> port detector

## Installment

```shell
$ npm i detect-port -g
```

## Quick Start

```shell
# detect port 80
$ detect -p 80

# or like this
$ detect --port 80

# will get result below
$ port: 80 was occupied, try port: 1024

# with verbose
$ detect --port 80 --verbose

# more help?
$ detect -h
```

## Use As Module

```js
var detect = require('detect-port');

/**
 * normal usage
 */

detect(port, function(error, _port) {

  if (port === _port) {
    console.log('port: %d was not occupied', port);
  } else {
    console.log('port: %d was occupied, try port: %d', port, _port);
  }
});

/**
 * use in co v3
 * for a yield syntax instead of callback function implement
 */

var co = require('co');

co(function *() {
  var _port = yield detect(port);

  if (port === _port) {
    console.log('port: %d was not occupied', port);
  } else {
    console.log('port: %d was occupied, try port: %d', port, _port);
  }
})();

/**
 * use as a promise
 */

var promisePort = detect(port);

promisePort.then(function(_port) {
  if (port === _port) {
    console.log('port: %d was not occupied', port);
  } else {
    console.log('port: %d was occupied, try port: %d', port, _port);
  }
});

```

## Clone and Run test

```shell

# clone from git
$ git clone git://github.com/xudafeng/detect-port.git

$ cd detect-port

# install dependencies
$ make install

# test and coverage
$ make test
```

## License

[MIT](LICENSE)

Copyright (c) 2015 xdf
