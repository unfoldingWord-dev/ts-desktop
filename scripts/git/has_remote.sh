#!/bin/bash

# checks if a remote has been defined locally

REMOTE=$1
HAS_REMOTE=$(git remote | grep "^$REMOTE$")

if [[ $HAS_REMOTE ]]; then
	echo true
fi
