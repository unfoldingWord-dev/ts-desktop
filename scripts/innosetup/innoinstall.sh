#!/bin/bash

rm -rf /tmp/inno
mkdir /tmp/inno
cd /tmp/inno

#TODO: ideally we'd download the most recent version here http://www.jrsoftware.org/download.php/is.exe
# but innoextract only supports up to version 5.5.3
wget -O is.exe http://files.jrsoftware.org/is/5/isetup-5.5.3.exe --no-check-certificate
innoextract is.exe
mkdir -p ~/".wine/drive_c/inno"
cp -a app/* ~/".wine/drive_c/inno"
