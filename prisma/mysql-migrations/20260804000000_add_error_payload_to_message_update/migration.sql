-- AlterTable MessageUpdate
-- Add errorPayload column to store Meta API error details (code, title, message) for failed messages
ALTER TABLE `MessageUpdate` ADD COLUMN `errorPayload` JSON;

-- Add createdAt column with default CURRENT_TIMESTAMP to track when the error was recorded
ALTER TABLE `MessageUpdate` ADD COLUMN `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
