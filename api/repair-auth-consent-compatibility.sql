-- Some local databases retain this column from an older schema. The current
-- registration contract does not collect a separate refund-policy acceptance.
-- An empty legacy value means no version was recorded; it does not assert consent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_consents'
      AND column_name = 'RefundPolicyVersion'
  ) THEN
    ALTER TABLE public.user_consents ALTER COLUMN "RefundPolicyVersion" SET DEFAULT '';
  END IF;
END $$;
