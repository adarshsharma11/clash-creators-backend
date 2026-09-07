-- Allow MVP clash join without a login User
ALTER TABLE "CreatorProfile" ALTER COLUMN "userId" DROP NOT NULL;

-- Prevent duplicate social identities across creators
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorSocialAccount_platform_username_key" ON "CreatorSocialAccount"("platform", "username");
CREATE INDEX IF NOT EXISTS "CreatorSocialAccount_username_idx" ON "CreatorSocialAccount"("username");
