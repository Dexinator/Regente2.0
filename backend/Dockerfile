FROM node:18
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
CMD ["node", "index.js"]
