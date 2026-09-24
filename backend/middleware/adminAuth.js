/**
 * Minimal gate for administrative endpoints.
 *
 * This is a SHARED SECRET, not user authentication. There are no accounts,
 * no roles, and no per-person audit trail — everyone with the key is
 * indistinguishable. It exists so the admin dashboard isn't wide open to
 * anyone who finds the URL. Real deployments need proper user auth.
 */
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_KEY;

  // Fail closed: if no key is configured, refuse rather than allow everyone.
  if (!expected) {
    console.error("ADMIN_KEY is not set — refusing admin request.");
    return res.status(503).json({ error: "Admin access is not configured on this server" });
  }

  const provided = req.get("x-admin-key");

  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

module.exports = requireAdmin;