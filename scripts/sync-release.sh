#!/bin/bash

API="https://api.github.com/repos/Apisium/PureLauncher/releases/latest"

JSON="`curl "$API"`"
BODY="`echo "$JSON" | jq -r '.body'`"
VERSION="`echo "$BODY" | jq -r '.version'`"
FILES="`echo "$JSON" | jq -r '.assets[].name'`"

ROOT="https://github.com/Apisium/PureLauncher/releases/download"
FOLDER="/var/www/download/pl"

mkdir -p "$FOLDER" || exit -1

for FILE in $FILES; do
	EXTENSION="${FILE##*.}"
	[[ "$EXTENSION" != "json" ]] && [[ "$EXTENSION" != "html" ]] || continue
	FROM="$ROOT/$VERSION/$FILE"
	SAVE_TO="$FOLDER/$VERSION/$FILE"
	SUPPOSED="`echo "$BODY" | jq -r ".$EXTENSION"`"
	mkdir -p "`dirname "$SAVE_TO"`"
	for i in 1 2 3; do
		[[ -e "$SAVE_TO" ]] && sha1sum "$SAVE_TO" | grep "$SUPPOSED" && break
		wget -c -t 1 -T 15 -O "$SAVE_TO" "$FROM" || [[ $i -eq 3 ]] && exit -1 || continue
		sha1sum "$SAVE_TO" | grep "$SUPPOSED" && break  || [[ $i -eq 3 ]] && exit -1 || continue
	done
done
