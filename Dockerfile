# Builder
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Production
FROM node:20-bookworm-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY public ./public
COPY certs ./certs

RUN mkdir -p /app/uploads /app/logs

RUN groupadd -g 1001 innopolois && \
    useradd -u 1001 -g innopolois -m innopolois

RUN chown -R innopolois:innopolois /app
USER innopolois

EXPOSE 7100
CMD ["node", "dist/server.js"]
