# ============================================
# Stage 1: Build — คอมไพล์ TypeScript → JavaScript
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# คัดลอก package files ก่อน เพื่อใช้ cache layer ของ Docker
COPY package.json package-lock.json ./
RUN npm ci

# คัดลอก source code และ config ที่จำเป็นสำหรับ build
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript → dist/
RUN npx tsc

# ============================================
# Stage 2: Production — รัน app จริง
# ============================================
FROM node:18-alpine

WORKDIR /app

# ติดตั้งเฉพาะ production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# คัดลอก JavaScript ที่ build แล้วจาก stage ก่อนหน้า
COPY --from=builder /app/dist ./dist

# สร้างโฟลเดอร์สำหรับเก็บรูปภาพ
RUN mkdir -p public/uploadsImg

# คัดลอกไฟล์ static (รูปภาพ placeholder, etc.)
COPY public/ ./public/

# เปิดพอร์ตตาม PORT ใน .env (default 3000)
EXPOSE 3000

# รัน app ตาม script "start" ใน package.json → node dist/index.js
CMD ["node", "dist/index.js"]
