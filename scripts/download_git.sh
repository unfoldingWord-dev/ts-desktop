#!/bin/sh
unset DISPLAY
dir=$1
version=$2
osbits=$3

mkdir $dir
wget wget -O "$dir/git-$osbits-bit.exe" "https://github.com/git-for-windows/git/releases/download/v$version.windows.1/Git-$version-$osbits-bit.exe"
