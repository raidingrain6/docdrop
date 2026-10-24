# DocDrop

DocDrop is a hackathon prototype for routing incoming documents for small firms.
It demonstrates two tenant workspaces, tenant-specific routing rules, integration
status, and a manual test-file run. A live fastn widget has been created in the
workspace as `wgt_651b5e32ea5a` with Gmail, Google Drive, Slack, HubSpot, and
Notion attached.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Vercel environment variables

Add these in Vercel Project Settings -> Environment Variables. The first four
are public configuration; the last four are server-side configuration used by
`api/embed-token.js`.

```text
VITE_FASTN_WIDGET_ID=wgt_651b5e32ea5a
VITE_FASTN_WORKFLOW_ID=wf_a1fd67dfd0b2
VITE_FASTN_TRIGGER_URL=https://webhooks.fastn.dev/prod/triggers/personal_0978161c45b729395e36/webhooks/docdrop-inbound-router
VITE_FASTN_EMBED_URL=
FASTN_API_URL=<fastn API base URL>
FASTN_API_KEY=<fastn API key>
FASTN_IDV_SECRET=<fastn identity verification secret>
FASTN_WIDGET_ID=wgt_651b5e32ea5a
```

Never commit the API key or identity secret, and never prefix either secret
with `VITE_`.

## Demo path

1. Start on **Overview** for Acme Accounting.
2. Click **Process a test file** and inspect **Activity**.
3. Open **Integrations** to show the connected tools and fastn embed handoff.
4. Open **Routing rules** to show tenant-specific rules.
5. Change the seeded tenant data in `src/main.jsx` to demonstrate a second
   workspace with different destinations and connected accounts.

## Fastn integration

The Integrations page reads `VITE_FASTN_WIDGET_ID`, `VITE_FASTN_WORKFLOW_ID`,
and optionally renders `VITE_FASTN_EMBED_URL`. The widget ID and workflow ID
default to the live DocDrop resources above.

The published workflow is `wf_a1fd67dfd0b2` (`docdrop_document_router`). Its
dedicated webhook is:

```text
https://webhooks.fastn.dev/prod/triggers/personal_0978161c45b729395e36/webhooks/docdrop-inbound-router
```

Send a JSON body containing `tenantId`, `fileName`, `fileId`, and `sender`.
The webhook routes only to the DocDrop workflow. An existing trigger already
on the widget was preserved and was not modified.

The remaining production step is server-side token minting:

1. Keep `FASTN_API_KEY` and `FASTN_IDV_SECRET` in backend environment variables.
2. Register the active tenant with `POST /api/v1/orgs`.
3. Mint a tenant-scoped embed token with `POST /api/v1/embed/token`, sending
   `x-org-id`, `x-user-id`, and the HMAC identity header.
4. Return the resulting iframe URL to the browser as `VITE_FASTN_EMBED_URL`
   or from a server-rendered integration page.

Never put the API key or identity secret in `.env` variables prefixed with
`VITE_`; Vite exposes those values to the browser.

## Current working behavior

- The **Process a test file** button posts to the published DocDrop webhook
  using `VITE_FASTN_TRIGGER_URL`.
- Routing rules can be edited per tenant and saved to browser storage.
- The **Connect account** buttons open the secure widget URL when
  `VITE_FASTN_EMBED_URL` is configured.
- Without the embed URL, the app explains the missing server configuration
  instead of pretending a connection succeeded.
