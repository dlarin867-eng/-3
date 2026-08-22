import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

// S3-совместимый клиент — работает и с настоящим AWS S3, и с Cloudflare R2
// (дешевле для старта, см. backend-developer.md "Стек"). Настраивается через
// S3_ENDPOINT: пусто = настоящий AWS, заполнено = R2/другой совместимый провайдер.
const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT || undefined,
  credentials: env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
    ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
    : undefined,
});

/**
 * Загружает фото блюда в хранилище. Возвращает ключ объекта (не URL) —
 * публичного доступа к фото нет, только через signed URL (getPhotoUrl).
 */
export async function uploadMealPhoto(userId: string, buffer: Buffer, contentType: string) {
  const key = `meal-photos/${userId}/${randomUUID()}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return key;
}

/** Временная подписанная ссылка на фото — для показа в карточке блюда/дневнике. */
export async function getPhotoUrl(key: string, expiresInSeconds = 300) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}

/** Немедленное удаление — используется и политикой ретеншна, и при удалении аккаунта (НФТ 5.3). */
export async function deleteMealPhoto(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

/**
 * Политика короткого срока хранения (НФТ 5.3): фото не нужно после того, как
 * распознавание подтверждено — храним PHOTO_RETENTION_DAYS дней на случай
 * повторной проверки/жалобы, потом удаляем.
 *
 * Сама периодическая задача (cron/scheduled job) — блок 10 (DevOps,
 * qa-devops). Здесь — только запрос "что пора удалить" и сам вызов удаления,
 * которые эта задача будет использовать.
 */
export async function findMealPhotosToExpire(prisma: PrismaClient) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - env.PHOTO_RETENTION_DAYS);
  return prisma.meal.findMany({
    where: { photoKey: { not: null }, photoDeletedAt: null, loggedAt: { lt: cutoff } },
    select: { id: true, photoKey: true },
  });
}
