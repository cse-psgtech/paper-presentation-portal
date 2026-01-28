FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Define build arguments for environment variables
ARG VITE_API_BACKEND_URL

# Set environment variables from build args
ENV VITE_API_BACKEND_URL=$VITE_API_BACKEND_URL

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]