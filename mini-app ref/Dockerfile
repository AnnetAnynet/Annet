FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_* — из GitLab file variable MINI_APP → .env_mini_app → compose --env-file
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_BOT_USERNAME
ENV VITE_BOT_USERNAME=$VITE_BOT_USERNAME
ARG VITE_SUPPORT_BOT_USERNAME
ENV VITE_SUPPORT_BOT_USERNAME=$VITE_SUPPORT_BOT_USERNAME
ARG VITE_DEV_TELEGRAM_ID
ENV VITE_DEV_TELEGRAM_ID=$VITE_DEV_TELEGRAM_ID
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
