#!/bin/bash

declare AUTHOR=$(git --no-pager show -s --format="%aN" $1)
echo "$AUTHOR"
