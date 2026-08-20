CREATE OR REPLACE PROCEDURE auth_cleanup_expired_otps()
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_otps
    SET
        "ConsumedAt" = now(),
        "UpdatedAt" = now()
    WHERE "ConsumedAt" IS NULL
      AND "ExpiresAt" < now();
END;
$$;
