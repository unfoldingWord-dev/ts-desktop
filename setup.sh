#!/bin/bash

sudo apt-get install software-properties-common build-essential
sudo add-apt-repository ppa:git-core/ppa -y
wget -qO- https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y git nodejs

mkdir -p ~/Desktop && cd ~/Desktop && git clone https://github.com/unfoldingWord-dev/ts-desktop
cd ts-desktop && git checkout develop

sudo npm install -g gulp
sudo npm install -g bower
npm install && bower install

exit
