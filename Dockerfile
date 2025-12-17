# Estágio 1: Compilação da aplicação Angular
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

# Estágio 2: Servidor de produção com Nginx
FROM nginx:alpine

# Copia os arquivos da aplicação compilada
COPY --from=build /app/dist/inc-wayos-front/browser /usr/share/nginx/html

# A configuração do Nginx e os certificados serão montados via volumes no docker-compose.
# Expõe as portas (serão mapeadas no docker-compose)
EXPOSE 80
EXPOSE 443