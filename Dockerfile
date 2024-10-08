FROM node:16.6.1-alpine3.14

ARG DATE_CREATED
ARG VERSION

LABEL org.opencontainers.image.created=$DATE_CREATED
LABEL org.opencontainers.image.version=$VERSION
LABEL org.opencontainers.image.authors="JovannMC"
LABEL org.opencontainers.image.vendor="JovannMC"
LABEL org.opencontainers.image.title="Discord TTS Bot"
LABEL org.opencontainers.image.description="A Text-to-Speech bot for Discord."
LABEL org.opencontainers.image.source="https://github.com/JovannMC/discord-tts-bot"

RUN apk add --no-cache ffmpeg

WORKDIR /opt/app

COPY package*.json ./

RUN npm ci --only=prod

COPY . .

CMD ["npm", "start"]
