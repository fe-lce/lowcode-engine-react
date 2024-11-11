#!/usr/bin/env bash

set -e

lerna run build \
  --scope @felce/lowcode-react-renderer \
  --scope @felce/lowcode-react-simulator-renderer \
  --scope @felce/lowcode-react-renderer-core \
  --stream

lerna run build:umd \
  --scope @felce/lowcode-react-simulator-renderer \
  --scope @felce/lowcode-react-renderer \
  --stream
