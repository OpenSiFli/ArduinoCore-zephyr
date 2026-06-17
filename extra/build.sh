#!/bin/bash

# Copyright (c) Arduino s.r.l. and/or its affiliated companies
# SPDX-License-Identifier: Apache-2.0

set -e

if ! command -v bun >/dev/null 2>&1; then
	echo "bun is required. Install it from https://bun.sh/ and retry." 1>&2
	exit 1
fi

exec bun run scripts/ci/build-loader.ts "$@"
