#!/usr/bin/env bash

rm -rf package-lock.json pnpm-lock.yaml
lerna clean -y
find ./packages -type f -name "package-lock.json" -exec rm -f {} \;

pnpm i
