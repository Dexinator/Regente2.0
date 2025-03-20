# Usa una imagen de Node.js con npm
FROM node:18

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Definir el directorio de trabajo
WORKDIR /app

# Copiar package.json y pnpm-lock.yaml antes de instalar dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias usando pnpm
RUN pnpm install

# Copiar el código restante
COPY . .

# Comando para iniciar el servidor
CMD ["node", "src/index.js"]
