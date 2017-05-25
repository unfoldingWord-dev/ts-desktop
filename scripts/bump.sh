#!/bin/bash

# increments the build number of the project and commits it to the repo

set -o errexit -o nounset

git config user.name "Travis-CI"

# setup remote
REMOTE=upstream
HAS_REMOTE=$(scripts/git/has_remote.sh $REMOTE)
if [ $HAS_REMOTE ]; then
    git remote remove $REMOTE
fi
git remote add $REMOTE "https://$GITHUB_BUMP_TOKEN@github.com/unfoldingWord-dev/ts-desktop.git"

BUILD=$(gulp bump --silent)
git add package.json
git config user.email builder@travis-ci.com
git config user.name "Travis CI"
git commit -m "bumped build number to $BUILD [ci skip]"
git push -q $REMOTE HEAD:$TRAVIS_BRANCH && true # skip errors
