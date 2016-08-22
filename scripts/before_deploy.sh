#!/bin/bash

# the travis before_deploy block runs for every deploy provider (as odd as that is).
# this script will on run its contents once

set -e

if [[ -z "$BEFORE_DEPLOY_RUN" ]]; then
  export BEFORE_DEPLOY_RUN=1;

  if [[ -z $TRAVIS_TAG ]]; then
    ./scripts/bump.sh
  fi
  bower install
  gulp build --win
  gulp build --linux
  gulp build --osx
  gulp release
fi
