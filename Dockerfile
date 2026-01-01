# ---------- Build Stage ----------
# Node 23 có native File API hoàn chỉnh
FROM node:23-alpine AS builder

WORKDIR /app

# Copy package files và install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build arguments cho production
ARG NEXT_PUBLIC_CHAT_SERVER_URL
ENV NEXT_PUBLIC_CHAT_SERVER_URL=$NEXT_PUBLIC_CHAT_SERVER_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build application
RUN npm run build

# ---------- Production Stage ----------
# Node 23 có native File API hoàn chỉnh
FROM node:23-alpine

# Install dumb-init và curl để xử lý signals và health checks đúng cách
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application từ builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create upload directory với permissions đúng và cấu trúc thư mục
RUN mkdir -p ./public/uploads/2025/09/09 && \
    chown -R nextjs:nodejs ./public/uploads && \
    chmod -R 755 ./public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Sử dụng dumb-init để xử lý signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
    