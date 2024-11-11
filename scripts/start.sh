#!/usr/bin/env bash

pkgName="@felce/lowcode-react-simulator-renderer"

if [ "$1" ]; then
  pkgName="$1"
fi

lerna exec --scope $pkgName -- pnpm build:watch
lerna exec --scope $pkgName -- pnpm preview
