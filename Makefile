current_version = $$(git branch 2>/dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/')
npm_bin= $$(npm bin)

all: test
clean:
	@rm -rf ./node_modules
install:
	@npm install
pull:
	@git pull origin ${current_version}
push:
	@git push origin ${current_version}
test: install
	@node --harmony \
		${npm_bin}/istanbul cover ${npm_bin}/_mocha \
		-- \
		--timeout 10000 \
		--require co-mocha
travis: install
	@NODE_ENV=test ${npm_bin}/istanbul cover \
		${npm_bin}/_mocha \
		--report lcovonly \
		-- -t 20000 test/*.test.js
jshint:
	@${npm_bin}/jshint .
.PHONY: test
