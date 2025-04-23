FROM node:lts AS runtime
RUN npm install -g pnpm
WORKDIR /app
COPY . .

RUN pnpm install
# En desarrollo, no compiles y usa el modo dev
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD pnpm dev --host