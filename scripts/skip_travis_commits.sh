#!/bin/bash


REV=$(git rev-parse --short HEAD)
AUTHOR=$(scripts/git/author.sh $REV)

if [ "$AUTHOR" == "Travis-CI" ]; then
  echo "$AUTHOR created this commit. Canceling build..."
  exit 0
fi
