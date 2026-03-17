-- CreateEnum
CREATE TYPE "ReviewCategory" AS ENUM ('GOOD_DRIVING', 'POLITE', 'ON_TIME', 'CLEAN_CAR', 'SAFE_DRIVING', 'GOOD_COMMUNICATION', 'FAIR_PRICE');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "categories" "ReviewCategory"[];
