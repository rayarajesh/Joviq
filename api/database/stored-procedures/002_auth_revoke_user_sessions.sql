CREATE OR REPLACE PROCEDURE auth_revoke_user_sessions(
    p_user_id uuid,
    p_except_session_id uuid,
    p_revoked_by_ip text,
    p_reason text
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_sessions
    SET
        "RevokedAt" = now(),
        "RevokedByIp" = p_revoked_by_ip,
        "RevocationReason" = p_reason,
        "UpdatedAt" = now()
    WHERE "UserId" = p_user_id
      AND "RevokedAt" IS NULL
      AND (p_except_session_id IS NULL OR "Id" <> p_except_session_id);
END;
$$;
