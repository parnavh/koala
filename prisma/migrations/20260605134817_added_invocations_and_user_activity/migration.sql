-- AlterTable
ALTER TABLE "GlobalMetrics" ADD COLUMN "totalActiveUsers" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "GuildMetrics" ADD COLUMN     "invocations" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "voiceCharacters" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "UserActivity" (
    "userId" BIGINT NOT NULL,
    "invocations" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("userId","date")
);

-- CreateIndex
CREATE INDEX "UserActivity_date_idx" ON "UserActivity"("date");
