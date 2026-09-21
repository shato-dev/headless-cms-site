# Meilisearch for production (M6), built for Render Free.
# Build context is this directory (search/). The official image is pinned to the
# same minor version as docker-compose.yml.
FROM getmeili/meilisearch:v1.53

# production mode requires a master key and turns off the dev dashboard.
# The indexing memory cap keeps indexing inside Render Free's 512 MB.
ENV MEILI_ENV=production \
    MEILI_NO_ANALYTICS=true \
    MEILI_MAX_INDEXING_MEMORY=200MiB

COPY settings.json documents.json entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# tini reaps zombie processes and forwards signals (same as the base image).
ENTRYPOINT ["tini", "--", "/app/entrypoint.sh"]
CMD []
