ALTER TABLE "flashcard_review_state" ADD COLUMN IF NOT EXISTS "sessionDay" text NOT NULL DEFAULT '';
ALTER TABLE "flashcard_review_state" ADD COLUMN IF NOT EXISTS "retryFlashcardIds" text[] NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS "flashcard_review" (
 "id" uuid PRIMARY KEY,
 "flashcardId" uuid NOT NULL REFERENCES "flashcard"("id") ON DELETE CASCADE,
 "projectId" uuid NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
 "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 "rating" "recall_levels" NOT NULL,
 "reviewedAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "flashcard_review_card_idx" ON "flashcard_review" ("flashcardId", "reviewedAt");
