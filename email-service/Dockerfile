FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar código
COPY . .

# Expor porta
EXPOSE 3001

# Variáveis de ambiente necessárias (devem ser passadas no runtime)
ENV NODE_ENV=production

# Comando de start
CMD ["npm", "start"]
