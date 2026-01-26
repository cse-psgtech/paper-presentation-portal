FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BACKEND_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV VITE_API_BACKEND_URL=$VITE_API_BACKEND_URL

RUN npm run build

# Run time Image
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
