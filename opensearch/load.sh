#!/usr/bin/env bash
# Recreate the "works" index and bulk-load search/documents.json (100 works). Run from the repo root.
set -euo pipefail
U=${OPENSEARCH_URL:-http://127.0.0.1:9200}
curl -s -X DELETE "$U/works" >/dev/null || true
curl -sf -X PUT "$U/works" -H 'Content-Type: application/json' -d @opensearch/index.json | jq -c .
# _bulk takes NDJSON: one action line, then one document line, per document.
jq -c '.[] | {index: {_index: "works", _id: .id}}, .' search/documents.json \
  | curl -sf -X POST "$U/_bulk" -H 'Content-Type: application/x-ndjson' --data-binary @- \
  | jq -c '{errors, items: (.items | length)}'
