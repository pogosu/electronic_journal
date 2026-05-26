# ============================
# Backend Dockerfile
# ============================
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/app.js"]
