#!/bin/bash

set -e

apt-get install software-properties-common build-essential
add-apt-repository ppa:git-core/ppa -y
bash -c "$(wget -qO- https://deb.nodesource.com/setup_5.x)"
apt-get install -y git nodejs

npm install -g gulp
npm install -g bower

exit
