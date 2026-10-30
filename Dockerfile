# Build once on the CI machine's own platform; the output is plain JavaScript, so the same build runs on the Arm
# production server. Only the small runtime stage is per platform.
FROM --platform=$BUILDPLATFORM node:25-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Local docker compose only: next.config.mjs bakes this /api/v1 proxy target in at build time. In production Caddy
# sends /api/* straight to the backend, so the value there does not matter.
ARG BACKEND_URL=http://localhost:8080
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:25-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/login || exit 1
CMD ["node", "server.js"]
