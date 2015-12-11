#!/bin/bash

set -e

mkdir -p ~/Desktop
cd ~/Desktop
git clone https://github.com/unfoldingWord-dev/ts-desktop
cd ts-desktop

git checkout develop
npm install
bower install

exit
