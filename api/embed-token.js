import crypto from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const tenantId = String(req.query.tenantId || "");
  const userId = String(req.query.userId || "demo-user");
  if (!/^tenant_(acme|globex)$/.test(tenantId)) {
    return res.status(400).json({ error: "A valid tenantId is required" });
  }

  const { FASTN_API_URL, FASTN_API_KEY, FASTN_IDV_SECRET, FASTN_WIDGET_ID } = process.env;
  if (!FASTN_API_URL || !FASTN_API_KEY || !FASTN_IDV_SECRET || !FASTN_WIDGET_ID) {
    return res.status(500).json({ error: "Fastn server environment is not configured" });
  }

  const identityHmac = crypto.createHmac("sha256", FASTN_IDV_SECRET)
    .update(`${tenantId}\n${userId}`)
    .digest("hex");

  const response = await fetch(`${FASTN_API_URL}/v1/embed/token`, {
    method: "POST",
    headers: {
      "x-api-key": FASTN_API_KEY,
      "Content-Type": "application/json",
      "x-org-id": tenantId,
      "x-user-id": userId,
      "x-identity-hmac": identityHmac,
    },
    body: JSON.stringify({ widgetId: FASTN_WIDGET_ID }),
  });

  const body = await response.text();
  if (!response.ok) return res.status(502).json({ error: "Fastn embed token request failed", detail: body });
  return res.status(200).json(JSON.parse(body));
}
