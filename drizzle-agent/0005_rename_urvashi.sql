INSERT INTO `hg_agent_profiles`
  (`email`, `display_name`, `phone`, `title`, `avatar_url`, `role`, `active`, `created_at`, `updated_at`)
SELECT
  'urvashi@hausandgrace.ae',
  'Urvashi',
  `phone`,
  `title`,
  `avatar_url`,
  `role`,
  `active`,
  `created_at`,
  CURRENT_TIMESTAMP
FROM `hg_agent_profiles`
WHERE `email` = 'urvi@hausandgrace.ae'
  AND NOT EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );

UPDATE `hg_agent_credentials`
SET `email` = 'urvashi@hausandgrace.ae',
    `username` = 'urvashi'
WHERE `email` = 'urvi@hausandgrace.ae'
  AND EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );

UPDATE `hg_agent_sessions`
SET `email` = 'urvashi@hausandgrace.ae'
WHERE `email` = 'urvi@hausandgrace.ae'
  AND EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );

UPDATE `hg_agent_login_codes`
SET `email` = 'urvashi@hausandgrace.ae'
WHERE `email` = 'urvi@hausandgrace.ae'
  AND EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );

UPDATE `hg_agent_conversations`
SET `agent_email` = 'urvashi@hausandgrace.ae'
WHERE `agent_email` = 'urvi@hausandgrace.ae'
  AND EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );

UPDATE `hg_agent_documents`
SET `agent_email` = 'urvashi@hausandgrace.ae'
WHERE `agent_email` = 'urvi@hausandgrace.ae'
  AND EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );

UPDATE `hg_agent_email_log`
SET `agent_email` = 'urvashi@hausandgrace.ae'
WHERE `agent_email` = 'urvi@hausandgrace.ae'
  AND EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );

UPDATE `hg_agent_admin_audit`
SET `target_email` = 'urvashi@hausandgrace.ae'
WHERE `target_email` = 'urvi@hausandgrace.ae'
  AND EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );

DELETE FROM `hg_agent_profiles`
WHERE `email` = 'urvi@hausandgrace.ae'
  AND EXISTS (
    SELECT 1 FROM `hg_agent_profiles` WHERE `email` = 'urvashi@hausandgrace.ae'
  );
