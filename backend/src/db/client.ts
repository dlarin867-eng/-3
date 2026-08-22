import { PrismaClient } from "@prisma/client";

// Один инстанс на процесс — стандартная практика для Prisma в Node,
// чтобы не плодить лишние соединения с БД при hot-reload в dev-режиме.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
