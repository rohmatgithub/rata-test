FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

RUN npx prisma generate

FROM node:20-alpine AS runner

RUN apk add --no-cache wget

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

USER nestjs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
