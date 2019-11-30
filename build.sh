#!/bin/bash

# Clear out some cruft.
find . -name '.DS_Store' -type f -delete

# Build the Chrome extension, with only the minimal amount of stuff required.
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
rm -rf /tmp/ffbebuilds/web-ext-artifacts

pushd /tmp/ffbebuilds

zip -r ffbebuilds.zip *

popd

cp /tmp/ffbebuilds/ffbebuilds.zip ./build/

#Build the Firefox extension
web-ext build