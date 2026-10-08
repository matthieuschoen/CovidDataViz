-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Country" (
    "iso3" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "population" INTEGER,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("iso3")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "countryIso3" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStat" (
    "id" SERIAL NOT NULL,
    "countryIso3" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "confirmed" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "recovered" INTEGER NOT NULL,
    "newConfirmed" INTEGER NOT NULL,
    "newDeaths" INTEGER NOT NULL,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryIso3_name_key" ON "Region"("countryIso3", "name");

-- CreateIndex
CREATE INDEX "DailyStat_countryIso3_date_idx" ON "DailyStat"("countryIso3", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStat_countryIso3_date_key" ON "DailyStat"("countryIso3", "date");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryIso3_fkey" FOREIGN KEY ("countryIso3") REFERENCES "Country"("iso3") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStat" ADD CONSTRAINT "DailyStat_countryIso3_fkey" FOREIGN KEY ("countryIso3") REFERENCES "Country"("iso3") ON DELETE RESTRICT ON UPDATE CASCADE;

