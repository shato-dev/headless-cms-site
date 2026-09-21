# search/

The production Meilisearch (M6): a Docker image that runs on **Render Free** and
rebuilds its index from files in this directory every time it starts. (Local
development uses the Meilisearch in `docker-compose.yml`; this image is separate.)

| File | Role |
|---|---|
| `documents.json` | The 100 works to index (`id`, `title`, `author`, `authorReading`, `summary`, `genreTags`). Generated, then committed. Same public text the site publishes. |
| `settings.json` | Index settings: searchable attributes and their order, Japanese locale, typo tolerance thresholds. |
| `entrypoint.sh` | Starts Meilisearch, builds the index, creates the search-only API key. |
| `Dockerfile` | Official `getmeili/meilisearch` image plus the files above. |

## Why the index is rebuilt on every start

Render Free has no persistent disk. Whenever the service restarts or spins down
(after 15 minutes without requests) everything on its disk is lost, and the next
request wakes it up in about a minute. Rebuilding 100 documents takes a few
seconds, so the container simply starts from these files each time. For a short
moment after the port opens, the index may not exist yet; callers treat any
error from Meilisearch as "search unavailable".

## Updating the documents

After the microCMS content changes:

```bash
node --env-file=.env scripts/build-search-documents.mjs
git diff --stat search/documents.json   # review, then commit and open a PR
```

Render redeploys when `main` changes (if auto-deploy is on).

## Try the image locally with Render Free's limits

```bash
docker build -t works-search:test search/
docker run --rm -m 512m --cpus 0.25 \
  -e MEILI_MASTER_KEY="$(openssl rand -hex 24)" -e PORT=10000 \
  -p 127.0.0.1:7711:10000 works-search:test
```

`-m 512m` / `--cpus 0.25` approximate the free instance (512 MB RAM; Render lists
its CPU only as "less than 1 CPU"). It starts in a few seconds and uses well
under 100 MB.

## Render setup (done by hand in the dashboard)

Cost safety: **do not add a payment method to the Render workspace.** Render's
FAQ says that without one, a workspace that would incur charges has its services
disabled instead of billed. If Render asks for a card while signing up, stop.

1. Create the Web Service from this repository with **Language = Docker**,
   **Root Directory = `search`**, **Instance Type = Free**. Pick a service name
   that contains no real name (it becomes part of the public URL).
2. Set the environment variable `MEILI_MASTER_KEY` to a long random string (for
   example `openssl rand -hex 24`), and keep a copy in the password manager. It is
   never committed and never given to the Worker.
3. Set the health check path to `/health`.
4. Get the search-only key once, from your own terminal (it is a credential:
   do not paste it into chats or commit it). It is stored as a Worker secret
   (`MEILI_SEARCH_KEY`, see `workers/search-api/`):

   ```bash
   curl -s -H "Authorization: Bearer <master key>" https://<service>.onrender.com/keys
   ```

   Use the `key` of the entry named `search-only`.
5. Check the dashboard's Billing page ("Monthly Included Usage") to see the free
   instance hours and outbound bandwidth used this month.
