# ---- Etapa 1: build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_BASE_HOST
ARG VITE_PROJECT_ID
ARG VITE_ID_CONSULTA_LISTA_USUARIOS

ENV VITE_BASE_HOST=$VITE_BASE_HOST \
    VITE_PROJECT_ID=$VITE_PROJECT_ID \
    VITE_ID_CONSULTA_LISTA_USUARIOS=$VITE_ID_CONSULTA_LISTA_USUARIOS

RUN npm run build

# ---- Etapa 2: servidor (nginx) ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
