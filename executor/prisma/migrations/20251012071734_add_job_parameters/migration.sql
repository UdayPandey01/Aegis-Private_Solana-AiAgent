-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN IF NOT EXISTS "parameters" TEXT DEFAULT '{"profitThreshold":0.5}';
