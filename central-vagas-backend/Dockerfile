# Usa a imagem oficial do Node.js como base
FROM node:18

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia o arquivo package.json e package-lock.json
# Isso ajuda a otimizar a construção, pois as dependências só serão reinstaladas se houver mudanças nesses arquivos
COPY package*.json ./

# Instala as dependências do Node.js
RUN npm install

# Copia todo o código da aplicação para o contêiner
COPY . .

# Expõe a porta em que o backend vai rodar
EXPOSE 3000

# Comando para rodar a aplicação Node.js
CMD ["node", "serve.js"]

