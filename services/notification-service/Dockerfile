FROM node:20-alpine as base
WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Build stage for TypeScript
FROM base as builder
WORKDIR /app
COPY . .
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm run build

# Runtime image
FROM node:20-alpine as runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only needed files
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/views ./views

EXPOSE 3003
CMD ["npm", "start"]

