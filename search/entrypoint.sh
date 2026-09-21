#!/bin/sh
# Container entrypoint for the Meilisearch instance on Render Free (M6).
#
# Render Free has no persistent disk: the index vanishes whenever the service
# restarts or spins down after 15 idle minutes. So on every start this script
#   1. starts Meilisearch,
#   2. rebuilds the index from documents.json + settings.json (100 works, a few seconds),
#   3. creates a search-only API key with a fixed uid.
# The key's value is derived from the uid and the master key, so it is the same
# after every restart and the Worker's stored copy stays valid.
#
# Env: MEILI_MASTER_KEY (required; set in the Render dashboard, never in the repo),
#      PORT (Render sets it; defaults to 7700 for local runs).
set -eu

: "${MEILI_MASTER_KEY:?MEILI_MASTER_KEY must be set}"
PORT="${PORT:-7700}"
BASE="http://127.0.0.1:${PORT}"
INDEX="works"
# Fixed uid of the search-only key (not a secret; the key value is what matters).
SEARCH_KEY_UID="5b2c3a4e-6d7f-4a8b-9c0d-1e2f3a4b5c6d"

meilisearch --http-addr "0.0.0.0:${PORT}" &
MEILI_PID=$!
# Forward stop signals so `docker stop` / Render shut Meilisearch down cleanly.
trap 'kill -TERM "$MEILI_PID" 2>/dev/null || true' TERM INT

# Authenticated call to the local Meilisearch. Usage: api METHOD PATH [curl args...]
api() {
  method="$1"; path="$2"; shift 2
  curl -fsS -X "$method" "${BASE}${path}" \
    -H "Authorization: Bearer ${MEILI_MASTER_KEY}" \
    -H "Content-Type: application/json" "$@"
}

# Wait until the HTTP server answers (up to ~30 s).
i=0
until curl -fsS "${BASE}/health" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then echo "Meilisearch did not become healthy" >&2; exit 1; fi
  sleep 0.5
done

# Meilisearch processes writes as asynchronous "tasks". Wait until none are
# queued or running, then fail loudly if any task failed.
wait_for_tasks() {
  i=0
  until api GET "/tasks?statuses=enqueued,processing&limit=1" | grep -q '"total":0'; do
    i=$((i + 1))
    if [ "$i" -ge 240 ]; then echo "tasks did not finish in time" >&2; exit 1; fi
    sleep 0.5
  done
  if ! api GET "/tasks?statuses=failed&limit=1" | grep -q '"total":0'; then
    echo "a Meilisearch task failed" >&2
    api GET "/tasks?statuses=failed&limit=1" >&2
    exit 1
  fi
}

api POST "/indexes" --data "{\"uid\":\"${INDEX}\",\"primaryKey\":\"id\"}" >/dev/null
api PATCH "/indexes/${INDEX}/settings" --data-binary @/app/settings.json >/dev/null
api POST "/indexes/${INDEX}/documents" --data-binary @/app/documents.json >/dev/null
wait_for_tasks

api POST "/keys" --data "{\"uid\":\"${SEARCH_KEY_UID}\",\"name\":\"search-only\",\"description\":\"Search on the works index only\",\"actions\":[\"search\"],\"indexes\":[\"${INDEX}\"],\"expiresAt\":null}" >/dev/null

echo "index ready: ${INDEX}"
wait "$MEILI_PID"
