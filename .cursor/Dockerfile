# BFTC Cursor Cloud — Node 22 + Postgres 16 native (no DinD).
# Cursor clones the repo; do not COPY the project into this image.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    postgresql-16 \
    sudo \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && corepack enable \
  && rm -rf /var/lib/apt/lists/*

# Prisma / smokes connect via TCP localhost:5432.
RUN service postgresql start \
  && runuser -u postgres -- psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" \
  && service postgresql stop
