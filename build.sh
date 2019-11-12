#!/bin/bash

rm -rf /tmp/ffbebuilds
cp -r . /tmp/ffbebuilds
rm -r /tmp/ffbebuilds/build
rm -rf /tmp/ffbebuilds/.git
rm /tmp/ffbebuilds/.gitignore
rm -rf /tmp/ffbebuilds/.vscode
rm /tmp/ffbebuilds/build.sh
rm -rf /tmp/ffbebuilds/node_modules
rm /tmp/ffbebuilds/package-lock.json
rm /tmp/ffbebuilds/package.json

pushd /tmp/ffbebuilds

zip -r ffbebuilds.zip *

popd

cp /tmp/ffbebuilds/ffbebuilds.zip ./build/

