FROM node:latest

# Working directory
WORKDIR /usr/src/app

# I know this is supposed to be after npm install but for whatever reason vite doesn't get installed if I do that

# Copy package.json and package-lock.json
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# ! In prod you are ecpected to provide the config file

# https://github.com/vuejs/devtools/issues/977
ENV NODE_OPTIONS='--no-webstorage'

RUN npm run frontend:prod

# Expose ports
EXPOSE 3000

# Run the server
CMD npm run backend:prod