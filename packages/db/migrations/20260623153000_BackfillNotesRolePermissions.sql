-- Backfill note permissions for existing system roles.
-- Older workspaces were seeded before Notes existed, so their system role rows
-- can be missing note permissions even though the shared defaults now include them.

INSERT INTO "workspace_role_permissions" ("workspaceRoleId", "permission", "granted", "createdAt")
SELECT wr.id, p.permission, true, NOW()
FROM "workspace_roles" wr
CROSS JOIN (
  VALUES
    ('note:view'),
    ('note:create'),
    ('note:edit'),
    ('note:delete')
) AS p(permission)
WHERE wr."isSystem" = true
  AND (
    (wr."name" = 'admin')
    OR (wr."name" = 'member' AND p.permission IN ('note:view', 'note:create'))
    OR (wr."name" = 'guest' AND p.permission = 'note:view')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "workspace_role_permissions" wrp
    WHERE wrp."workspaceRoleId" = wr.id
      AND wrp."permission" = p.permission
  );
