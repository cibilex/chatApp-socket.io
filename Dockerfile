# Temel alınacak imajı belirleyin
FROM node:14



# package.json ve package-lock.json'ı kopyalayın
COPY package*.json ./
COPY ecosystem.config.json ./


# Gerekli paketleri yükleyin
RUN npm i

# Kaynak kodu kopyalayın
COPY . .

# TypeScript kodunu derleyin
RUN npm run build
EXPOSE 8080


# PM2'yi başlatın
CMD ["node", "./dist/app.js"]