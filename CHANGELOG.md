# Changelog

## [2.0.1](https://github.com/node-modules/detect-port/compare/v2.0.0...v2.0.1) (2024-12-08)


### Bug Fixes

* use setTimeout Promise ([#58](https://github.com/node-modules/detect-port/issues/58)) ([db3ce1b](https://github.com/node-modules/detect-port/commit/db3ce1bd7c29bb5e6fcb60de1bccec0ef61d306f))

## [2.0.0](https://github.com/node-modules/detect-port/compare/v1.6.1...v2.0.0) (2024-12-08)


### ⚠ BREAKING CHANGES

* Drop Node.js < 16 support

1. 使用 ts 重构
2. 使用 tshy 支持 esm 和 cjs
3. test 使用 test-runner (这里需要 node v18 版本)

merge from https://github.com/node-modules/detect-port/pull/51

<!-- This is an auto-generated comment: release notes by coderabbit.ai
-->
## Summary by CodeRabbit

- **New Features**
- Introduced a new `waitPort` function to asynchronously wait for a
specified port to become available.
	- Added a new ESLint configuration to enforce TypeScript linting rules.

- **Bug Fixes**
	- Reverted a feature in the `detect-port` package due to issues raised.

- **Documentation**
	- Updated `README.md` for improved clarity and updated badge links.
	- Modified `CONTRIBUTING.md` to reflect changes in testing commands.

- **Chores**
	- Introduced a new TypeScript configuration file (`tsconfig.json`).
- Updated `package.json` to reflect changes in dependencies and project
structure.

- **Tests**
- Added comprehensive tests for the new `waitPort` and updated tests for
the CLI and `detectPort` function.
<!-- end of auto-generated comment: release notes by coderabbit.ai -->

### Features

* refactor with typescript to support esm and cjs both ([#56](https://github.com/node-modules/detect-port/issues/56)) ([b5d32d2](https://github.com/node-modules/detect-port/commit/b5d32d2422bd753a87ff2e995514ac41f1c85346))

## [1.6.1](https://github.com/node-modules/detect-port/compare/v1.6.0...v1.6.1) (2024-05-08)


### Reverts

* Revert "feat: use address@2 (#53)" (#54) ([48dfe47](https://github.com/node-modules/detect-port/commit/48dfe47d63f137b05f6a540ccfc0f0fa133a847a)), closes [#53](https://github.com/node-modules/detect-port/issues/53) [#54](https://github.com/node-modules/detect-port/issues/54)

## [1.6.0](https://github.com/node-modules/detect-port/compare/v1.5.1...v1.6.0) (2024-05-08)


### Features

* use address@2 ([#53](https://github.com/node-modules/detect-port/issues/53)) ([55f48d7](https://github.com/node-modules/detect-port/commit/55f48d755f3c8b480d4e4ce1065abc1c8e3c5a19))

---


1.5.1 / 2022-09-23
==================

**fixes**
  * [[`9dd9ce3`](http://github.com/node-modules/detect-port/commit/9dd9ce34b560a434ee3a393f6ddea884691f632f)] - fix: add #!/usr/bin/env node header (#49) (达峰的夏天 <<xudafeng@126.com>>)

1.5.0 / 2022-09-21
==================

**features**
  * [[`618dec5`](http://github.com/node-modules/detect-port/commit/618dec5661d94535800089f9d941f4896825cb69)] - feat: support wait port (#46) (达峰的夏天 <<xudafeng@126.com>>)

**fixes**
  * [[`a54e2ef`](http://github.com/node-modules/detect-port/commit/a54e2ef70e388ed4b0c7a4b79ad88bc91e0f8ae3)] - fix: typo on line 54 (#45) (Yavuz Akyuz <<56271907+yavuzakyuz@users.noreply.github.com>>)

**others**
  * [[`28f07b3`](http://github.com/node-modules/detect-port/commit/28f07b31a7c591cb28b13281246c7f0c64c3dded)] - 🤖 TEST: Run CI on Github Action (#47) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`ae55c95`](http://github.com/node-modules/detect-port/commit/ae55c956ca36749e22c48b8d1a7d98afec2e6a4d)] - Create codeql-analysis.yml (fengmk2 <<fengmk2@gmail.com>>)
  * [[`f35409d`](http://github.com/node-modules/detect-port/commit/f35409d53f9298a60e2c6c1560f42ea182025dd4)] - chore: update project config (xudafeng <<xudafeng@126.com>>)
  * [[`cd21d30`](http://github.com/node-modules/detect-port/commit/cd21d3044db73d1556bf264209c8fd0ee08fa9c4)] - chore: update readme (#43) (XiaoRui <<xiangwu619@gmail.com>>)
  * [[`da01e68`](http://github.com/node-modules/detect-port/commit/da01e68b43952e06430cc42f873e4253d8cba09e)] - chore: add .editorconfig (#42) (达峰的夏天 <<xudafeng@126.com>>)
  * [[`a2c6b04`](http://github.com/node-modules/detect-port/commit/a2c6b043954895cba9cbae369e0d79a337c9d73a)] - chore: update repo config (#41) (达峰的夏天 <<xudafeng@126.com>>)
  * [[`8da6f33`](http://github.com/node-modules/detect-port/commit/8da6f33e10b44cdbcfb9eb5727b0f2117e6929e9)] - chore: update readme (#38) (达峰的夏天 <<xudafeng@126.com>>)
  * [[`ee88ccb`](http://github.com/node-modules/detect-port/commit/ee88ccb9e2a747dc84a30bcfc1cd4c73b64e3ea5)] - chore: remove unuse file (fengmk2 <<fengmk2@gmail.com>>)

1.3.0 / 2018-11-20
==================

**features**
  * [[`a00357a`](http://github.com/node-modules/detect-port/commit/a00357aea32c4f011b7240641cb8da2dfc97b491)] - feat: support detect port with custom hostname (#35) (Ender Lee <<34906299+chnliquan@users.noreply.github.com>>)

**others**
  * [[`671094f`](http://github.com/node-modules/detect-port/commit/671094f3a3660a29a0920d78e39d17f8dead0b7a)] - update readme (xudafeng <<xudafeng@126.com>>)
  * [[`285e59b`](http://github.com/node-modules/detect-port/commit/285e59b0464d670c886007ff5052892393d57314)] - chore: add files to package.json (fengmk2 <<fengmk2@gmail.com>>)

1.2.3 / 2018-05-16
==================

**fixes**
  * [[`64777f8`](http://github.com/node-modules/detect-port/commit/64777f85cc519c9c4c2c84c23d2afed6a916f3c4)] - fix: ignore EADDRNOTAVAIL error when listen localhost (#33) (Haoliang Gao <<sakura9515@gmail.com>>)
  * [[`398bc4f`](http://github.com/node-modules/detect-port/commit/398bc4f65f4d61ddfdc9bf7721118ea1a3bb6289)] - fix: handle 0.0.0.0:port binding (#26) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`aedf44f`](http://github.com/node-modules/detect-port/commit/aedf44fc3f949de9ec187bdc8ee4d8daf84d6c2b)] - doc: tweak description (xudafeng <<xudafeng@126.com>>)
  * [[`b7ff76f`](http://github.com/node-modules/detect-port/commit/b7ff76f24db3d8d9123cbf396b9032b05a6b7146)] - update FAQ & contributor (xudafeng <<xudafeng@126.com>>)
  * [[`4a9e127`](http://github.com/node-modules/detect-port/commit/4a9e127b6d01bd45d9b689bd931d878aa9b5d397)] - cli tweak to verbose (#25) (xdf <<xudafeng@126.com>>),

1.1.3 / 2017-05-24
==================

  * fix: should ignore getaddrinfo ENOTFOUND error (#22)

1.1.2 / 2017-05-11
==================

  * fix: should double check 0.0.0.0 and localhost (#20)
  * docs: ignore type of port when checking if it's occupied (#18)

# 1.1.1 / 2017-03-17

  * fix: try to use next available port (#16)

# 1.1.0 / 2016-01-17

  * Use server listen to detect port

# 1.0.7 / 2016-12-11

  * Early return for rejected promise
  * Prevent promsie swallow in callback

# 1.0.6 / 2016-11-29

  * Bump version for new Repo

# 0.1.4 / 2015-08-24

  * Support promise

# 0.1.2 / 2014-05-31

  * Fix commander

# 0.1.1 / 2014-05-30

  * Add command line support

# 0.1.0  / 2014-05-29

  * Initial release
