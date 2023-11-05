FROM node:latest

ARG DEVELOPMENT

# Expose environment variables
ENV DEVELOPMENT=${DEVELOPMENT}

# Working directory
WORKDIR /usr/src/app

# Copy source code
COPY . .
# I know this is supposed to be after npm install but for whatever reason vite doesn't get installed if I do that

# Copy package.json and package-lock.json
# COPY package*.json ./

# Install dependencies
RUN npm install

RUN if [ "$DEVELOPMENT" != "true" ]; \
	then npm run frontend:dev; \
fi

# Expose ports
EXPOSE 3000
EXPOSE 5173

# Run the server
CMD if [ "$DEVELOPMENT" = "true" ]; \
	then npm run dev; \
else \
	npm run backend:prod; \
fi