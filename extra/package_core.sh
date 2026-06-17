#!/bin/bash

# Copyright (c) Arduino s.r.l. and/or its affiliated companies
# SPDX-License-Identifier: Apache-2.0

set -e

if ! command -v bun >/dev/null 2>&1; then
	echo "bun is required. Install it from https://bun.sh/ and retry." 1>&2
	exit 1
fi

ARTIFACT=${1:-sf32lb52}
VERSION=${2:-}
OUTPUT=${3:-}

if [ "$ARTIFACT" != "sf32lb52" ]; then
	echo "Only the sf32lb52 artifact is supported by this downstream fork." 1>&2
	exit 1
fi

ARGS=()
[ -z "$VERSION" ] || ARGS+=(--version "$VERSION")
[ -z "$OUTPUT" ] || ARGS+=(--out "$OUTPUT")

exec bun run scripts/ci/package-core.ts "${ARGS[@]}"
