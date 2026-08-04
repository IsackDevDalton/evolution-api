-- CreateIndex
-- Functional index on (instanceId, key->>'id') to speed up wamid lookups for Meta statuses
CREATE INDEX IF NOT EXISTS "Message_instanceId_key_id_idx" ON "Message" ("instanceId", (("key"->>'id')));
