git_version = $$(git branch 2>/dev/null | sed -e '/^[^*]/d'-e's/* \(.*\)/\1/')
npm_bin= $$(npm bin)

all: test
install:
	@npm install
server:
	npm i startserver --save-dev
	${npm_bin}/startserver -s -p 8080 &
pre-test: server
	sleep 5
test:
	@node \
		${npm_bin}/istanbul cover ${npm_bin}/_mocha \
		-- \
		--timeout 10000 \
		--require co-mocha
travis: install pre-test
	@node \
		${npm_bin}/istanbul cover ${npm_bin}/_mocha \
		--report lcovonly \
		-- -u exports \
		--timeout 10000 \
		--require co-mocha \
		--bail
jshint:
	@${npm_bin}/jshint .
.PHONY: test
