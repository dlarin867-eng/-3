-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('bulk', 'maintain', 'cut');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('system', 'light', 'dark');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('m', 'f');

-- CreateEnum
CREATE TYPE "MealSource" AS ENUM ('photo', 'barcode', 'manual');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "SupplementCategory" AS ENUM ('protein', 'gainer', 'creatine', 'bcaa', 'pre_workout', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "age" INTEGER NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "bodyweightKg" DOUBLE PRECISION NOT NULL,
    "goal" "Goal" NOT NULL DEFAULT 'maintain',
    "proteinTargetGPerKg" DOUBLE PRECISION NOT NULL DEFAULT 1.8,
    "proteinOverrideConfirmedAt" TIMESTAMP(3),
    "activityFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.375,
    "trainingDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "workoutTime" TEXT,
    "eveningSummaryTime" TEXT NOT NULL DEFAULT '20:00',
    "theme" "Theme" NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "MealSource" NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "Confidence",
    "matchedNutrientDb" BOOLEAN NOT NULL DEFAULT false,
    "confirmedManually" BOOLEAN NOT NULL DEFAULT false,
    "isOfflineDraft" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "photoKey" TEXT,
    "photoDeletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_items" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightG" DOUBLE PRECISION NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "matchedDbName" TEXT,

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplement_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "SupplementCategory" NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplement_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_targets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isTrainingDay" BOOLEAN NOT NULL,
    "calories" INTEGER NOT NULL,
    "proteinG" INTEGER NOT NULL,
    "carbsG" INTEGER NOT NULL,
    "fatG" INTEGER NOT NULL,
    "autoAdjustedFromCalories" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "meals_userId_loggedAt_idx" ON "meals"("userId", "loggedAt");

-- CreateIndex
CREATE INDEX "supplement_logs_userId_loggedAt_idx" ON "supplement_logs"("userId", "loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_targets_userId_date_key" ON "daily_targets"("userId", "date");

-- CreateIndex
CREATE INDEX "weight_logs_userId_loggedAt_idx" ON "weight_logs"("userId", "loggedAt");

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplement_logs" ADD CONSTRAINT "supplement_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
