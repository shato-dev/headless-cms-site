# OpenSearch lab (M7)

Throwaway single-node OpenSearch for **learning how a general-purpose search engine works**.
Not used by the site and never deployed. Free, no account, no card. Compare with Meilisearch (`../search/`).

Security is disabled and the port is bound to `127.0.0.1` only. Run everything from the repo root.

```bash
docker compose -f opensearch/docker-compose.yml up -d --build   # first build downloads ~1 GB; wait for "healthy"
./opensearch/load.sh                                             # create index "works" + bulk-load 100 works
docker compose -f opensearch/docker-compose.yml down -v         # tear down (data is disposable)
```

Uses about 1 GB of RAM (JVM heap 512 MB + overhead) vs ~60 MB for Meilisearch.
In the commands below, `U=http://127.0.0.1:9200` and `J='Content-Type: application/json'`.

## 1. Is it alive?

```bash
curl -s $U/                         # version info
curl -s $U/_cluster/health          # green / yellow / red
curl -s "$U/_cat/indices?v"
curl -s $U/_cat/plugins             # analysis-kuromoji should be listed
```

## 2. `_analyze` — what does the analyzer do to text?

An analyzer = char filter(s) → tokenizer → token filter(s). The tokens it emits are what go into the inverted index.

```bash
curl -s $U/_analyze -H "$J" -d '{"analyzer":"standard","text":"走れメロスは太宰治の作品"}'
curl -s $U/_analyze -H "$J" -d '{"analyzer":"kuromoji","text":"走れメロスは太宰治の作品"}'
curl -s $U/_analyze -H "$J" -d '{"analyzer":"english","text":"The Quick Foxes were running"}'
# build a chain by hand
curl -s $U/_analyze -H "$J" -d '{"char_filter":["html_strip"],"tokenizer":"standard","filter":["lowercase"],"text":"<b>Hello</b> WORLD"}'
```

## 3. Index + mapping

See `index.json` (custom analyzer `ja` = kuromoji tokenizer + base-form + lowercase).
`text` fields are analyzed; `keyword` fields (`genreTags`, `id`, `author.raw`) are stored as-is for exact match, filter, aggregation.

```bash
curl -s "$U/works/_mapping"
```

## 4. Bulk load and near-real-time

`load.sh` sends NDJSON to `_bulk`. Right after it, `_count` can still be 0: documents become searchable on the next refresh (default 1 s).

```bash
curl -s $U/works/_count
curl -s -X POST $U/works/_refresh    # force a refresh
```

## 5. Query DSL

```bash
# match: analyze the query, OR the tokens
curl -s $U/works/_search -H "$J" -d '{"query":{"match":{"summary":"恋 悲しみ"}}}'
# same, but all tokens required
curl -s $U/works/_search -H "$J" -d '{"query":{"match":{"summary":{"query":"恋 悲しみ","operator":"and"}}}}'
# phrase: tokens must be adjacent, in order
curl -s $U/works/_search -H "$J" -d '{"query":{"match_phrase":{"title":"蜘蛛の糸"}}}'
# several fields, title weighted x3
curl -s $U/works/_search -H "$J" -d '{"query":{"multi_match":{"query":"太宰","fields":["title^3","author","summary"]}}}'
# term: NOT analyzed, exact match on keyword
curl -s $U/works/_search -H "$J" -d '{"query":{"term":{"genreTags":"童話"}}}'
curl -s $U/works/_search -H "$J" -d '{"query":{"term":{"author":"宮沢賢治"}}}'       # 0 hits: author is text
curl -s $U/works/_search -H "$J" -d '{"query":{"term":{"author.raw":"宮沢賢治"}}}'   # works
# bool: must (AND, scored) / should (OR, scored) / filter (AND, not scored) / must_not
curl -s $U/works/_search -H "$J" -d '{"query":{"bool":{
  "must":[{"match":{"summary":"少年"}}],
  "filter":[{"term":{"genreTags":"小説"}}],
  "must_not":[{"term":{"author.raw":"太宰治"}}]}}}'
# fuzziness (typo tolerance) works per token
curl -s $U/works/_search -H "$J" -d '{"query":{"match":{"title":{"query":"走れメロズ","fuzziness":"AUTO"}}}}'
curl -s $U/works/_search -H "$J" -d '{"query":{"match":{"title":{"query":"羅生問","fuzziness":"AUTO","operator":"and"}}}}'
# aggregations (facet counts)
curl -s $U/works/_search -H "$J" -d '{"size":0,"aggs":{"g":{"terms":{"field":"genreTags"}}}}'
```

## 6. Scoring and highlight

```bash
# BM25 breakdown: idf (rarer term = higher), tf with length normalization (k1, b)
curl -s $U/works/_search -H "$J" -d '{"size":1,"explain":true,"query":{"match":{"summary":"少年"}}}'
curl -s $U/works/_search -H "$J" -d '{"size":1,"query":{"match":{"summary":"少年"}},"highlight":{"fields":{"summary":{}}}}'
```

## 7. Replicas and yellow

```bash
curl -s -X PUT $U/tmp_default                # default = 1 replica, but there is only 1 node
curl -s $U/_cluster/health                   # yellow: replica shard cannot be assigned
curl -s -X DELETE $U/tmp_default
```
