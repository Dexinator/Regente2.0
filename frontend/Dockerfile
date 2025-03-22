FROM node:lts AS runtime
RUN npm install -g pnpm
WORKDIR /app
COPY . .

RUN pnpm install
RUN pnpm run build

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD node ./dist/server/entry.mjs