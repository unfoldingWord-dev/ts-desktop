#!/bin/bash

# the travis before_deploy block runs for every deploy provider (as odd as that is).
# testing this script at the beginning of that block will ensure the contents only get ran once.


if ! [ "$BEFORE_DEPLOY_RUN" ]; then
  export BEFORE_DEPLOY_RUN=1;
  echo true
fi
