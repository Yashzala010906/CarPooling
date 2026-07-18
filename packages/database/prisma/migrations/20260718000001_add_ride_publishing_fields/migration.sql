-- Phase 1 (Ride Publishing): add the ride fields missing from the existing table.
-- The rides table itself already exists (see 20260718000000_init), so this only
-- adds the DRAFT status and the notes / route metrics columns.

-- AlterEnum
ALTER TYPE "RideStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "rides" ADD COLUMN     "estimatedDurationMins" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "routeDistanceKm" DOUBLE PRECISION;

-- Row Level Security: all reads/writes go through the NestJS API, which connects
-- as the table owner (owners bypass RLS). Enabling RLS with no policies makes the
-- table deny-by-default for any other role — e.g. Supabase's auto-generated
-- PostgREST endpoints — matching the project's API-layer authorization pattern.
ALTER TABLE "rides" ENABLE ROW LEVEL SECURITY;
