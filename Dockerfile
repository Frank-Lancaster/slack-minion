FROM node:12-alpine

# Set the timezone for the graph

ENV TZ=America/Phoenix


# Installs latest Chromium (73) package.


RUN apk update && apk upgrade && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk add --no-cache \
      chromium=~72.0.3626.121-r0 \
      nss@edge \
      freetype@edge \
      harfbuzz@edge \
      ttf-freefont@edge \
      curl

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROME_PATH '/usr/bin/chromium-browser'

# Puppeteer v1.12.2 works with Chromium 73.
RUN yarn add puppeteer@1.12.2

# Add user so we don't need --no-sandbox.
RUN mkdir -p /home/node/Downloads /app \
    && chown -R node:node /home/node \
    && chown -R node:node /app \
    && chown -R node:node /node_modules

# Run everything after as non-privileged user.
USER node

RUN curl -SL https://github.com/howdyai/botkit/archive/v0.6.4.tar.gz | tar xzpC /app

RUN cd /app/botkit-0.6.4/ && npm install

COPY package.json ./

RUN npm install

COPY --chown=node . /app/botkit-0.6.4/

WORKDIR /app/botkit-0.6.4

CMD ["node","supply-minion.js"]

