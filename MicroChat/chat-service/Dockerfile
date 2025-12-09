# Dockerfile base para serviços Node.js
FROM node:18-alpine

WORKDIR /app

# Copia e instala dependências
COPY package*.json ./
RUN npm install

# Copia o código da aplicação
COPY . .

EXPOSE $PORT

CMD ["npm", "start"]