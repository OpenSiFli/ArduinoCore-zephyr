#!/bin/bash

# Copyright (c) Arduino s.r.l. and/or its affiliated companies
# SPDX-License-Identifier: Apache-2.0

set -e

if ! command -v bun >/dev/null 2>&1; then
	echo "bun is required. Install it from https://bun.sh/ and retry." 1>&2
	exit 1
fi

if [ $# -lt 2 ] || [ $# -gt 3 ] ; then
	echo "Usage: $0 sf32lb52 <core_artifact_file> [<json_file>]" 1>&2
	exit 1
fi

ARTIFACT=$1
CORE_FILE=$2
JSON_FILE=${3:-distrib/package_sifli_index.json}

if [ "$ARTIFACT" != "sf32lb52" ]; then
	echo "Only the sf32lb52 artifact is supported by this downstream fork." 1>&2
	exit 1
fi

exec bun run scripts/ci/generate-index.ts \
	--core "$CORE_FILE" \
	--github-out "$JSON_FILE" \
	--cn-out "${JSON_FILE%.json}_cn.json"
