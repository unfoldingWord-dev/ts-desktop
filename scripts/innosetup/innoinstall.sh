#!/bin/bash

rm -rf /tmp/inno
mkdir /tmp/inno
cd /tmp/inno

wget -O is.exe http://www.jrsoftware.org/download.php/is.exe --no-check-certificate
innoextract is.exe
mkdir -p ~/".wine/drive_c/inno"
cp -a app/* ~/".wine/drive_c/inno"
