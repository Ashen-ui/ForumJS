FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /runForum
COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
COPY views/ ./views/
COPY static/ ./static/

RUN npx tsc
EXPOSE 3000
CMD ["node", "dist/server.js"]