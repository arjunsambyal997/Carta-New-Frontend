FROM node:26-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# next.config.mjs bakes the /api/v1 proxy target in at build time.
ARG BACKEND_URL=http://localhost:8080
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx","next","start","-p","3000"]
