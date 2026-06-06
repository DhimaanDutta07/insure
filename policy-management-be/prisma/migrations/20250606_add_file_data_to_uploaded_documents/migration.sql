-- AlterTable
ALTER TABLE "uploaded_documents" ADD COLUMN IF NOT EXISTS "file_data" BYTEA;
