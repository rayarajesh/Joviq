CREATE OR REPLACE PROCEDURE auth_create_audit_log(
    p_user_id uuid,
    p_event_type text,
    p_email text,
    p_phone text,
    p_ip_address text,
    p_user_agent text,
    p_metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO auth_audit_logs (
        "Id",
        "UserId",
        "EventType",
        "Email",
        "Phone",
        "IpAddress",
        "UserAgent",
        "MetadataJson",
        "CreatedAt"
    )
    VALUES (
        gen_random_uuid(),
        p_user_id,
        p_event_type,
        p_email,
        p_phone,
        p_ip_address,
        p_user_agent,
        p_metadata,
        now()
    );
END;
$$;
