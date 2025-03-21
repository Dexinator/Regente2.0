# Usa una imagen oficial de Node.js
FROM node:18

# Instalar PNPM globalmente
RUN npm install -g pnpm

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos de dependencias primero para aprovechar la caché de Docker
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto de la API
EXPOSE 3000

# Comando para iniciar el servidor en modo desarrollo
CMD ["pnpm", "dev"]