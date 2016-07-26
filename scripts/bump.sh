#!/bin/bash

set -o errexit -o nounset

#rev=$(git rev-parse --short HEAD)

#mkdir stage
#cd stage

#git init
git config user.name "Travis-CI"

git remote add upstream "https://$GITHUB_TOKEN@github.com/unfoldingWord-dev/ts-desktop.git"
#git fetch upstream
#git reset upstream/$TRAVIS_BRANCH

gulp bump
git add package.json
git commit -m "bumped build number"
git push -q upstream HEAD:$TRAVIS_BRANCH
