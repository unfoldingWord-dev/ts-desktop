#!/bin/sh
unset DISPLAY
dir=$1
version=$2
osbits=$3

if [ ! -d "$dir" ]; then
  mkdir $dir
fi

dest=$dir/Git-$version-$osbits-bit.exe
if [ ! -f "$dest" ]; then
  echo "downloading git $version for win$osbits"
  wget -O "$dest" "https://github.com/git-for-windows/git/releases/download/v$version.windows.1/Git-$version-$osbits-bit.exe"
fi
