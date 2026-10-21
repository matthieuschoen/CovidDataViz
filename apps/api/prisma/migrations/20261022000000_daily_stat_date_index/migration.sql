-- DropIndex (doublon de l'index unique DailyStat_countryIso3_date_key)
DROP INDEX "DailyStat_countryIso3_date_idx";

-- CreateIndex (agrégats globaux et « dernière date »)
CREATE INDEX "DailyStat_date_idx" ON "DailyStat"("date");
