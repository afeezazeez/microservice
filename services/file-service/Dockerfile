FROM node:20-alpine

# Install system dependencies for thumbnail generation
RUN apk add --no-cache \
    ffmpeg \
    poppler-utils \
    imagemagick \
    graphicsmagick

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3004

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]

