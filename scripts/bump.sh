#!/bin/bash

set -o errexit -o nounset

git config user.name "Travis-CI"
git remote add upstream "https://$GITHUB_TOKEN@github.com/unfoldingWord-dev/ts-desktop.git"

BUILD=$(gulp bump --silent)
git add package.json
git commit -m "bumped build number to $BUILD [ci skip]"
git push -q upstream HEAD:$TRAVIS_BRANCH && 0 # skip errors
