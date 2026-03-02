-- CreateTable
CREATE TABLE "GlobalMetrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "totalGuilds" INTEGER NOT NULL,
    "totalUsers" INTEGER NOT NULL,

    CONSTRAINT "GlobalMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalMetrics_date_key" ON "GlobalMetrics"("date");
