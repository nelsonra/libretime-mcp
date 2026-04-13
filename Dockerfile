# Stage 1 — build
# Install all dependencies (including devDependencies like TypeScript and Vite)
# and compile the project. This stage is discarded after the build — it never
# ends up in the final image, so its size doesn't matter.
FROM node:22-alpine AS build

WORKDIR /app

# Copy manifests first so npm ci is cached as its own layer.
# If only source files change on the next build, Docker reuses this layer
# and skips the install — significantly faster rebuilds.
COPY package.json package-lock.json ./
RUN npm ci

# Copy everything needed to compile
COPY tsconfig.json tsconfig.app.json vite.config.ts ./
COPY src ./src
COPY apps ./apps

# npm run build = clean + vite build (upload app) + tsc (MCP server)
RUN npm run build


# Stage 2 — runtime
# Start fresh from the same base image. Copy only the compiled output from
# the build stage and install production dependencies only. This is the image
# that actually runs — no TypeScript compiler, no Vite, no type definitions.
FROM node:22-alpine AS runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/http/admin.js"]
