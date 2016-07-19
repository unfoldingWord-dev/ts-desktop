#!/bin/bash

rm -rf /tmp/inno
mkdir /tmp/inno
cd /tmp/inno

wget --no-check-certificate -O is.exe http://www.jrsoftware.org/download.php/is.exe
innoextract is.exe
mkdir -p ~/".wine/drive_c/inno"
cp -a app/* ~/".wine/drive_c/inno"
