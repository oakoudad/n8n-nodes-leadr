# n8n-nodes-leadrspace

An [n8n](https://n8n.io/) community node that lets your workflows react in real time to
events from your [Leadr Space](https://leadr.space) account — a WhatsApp Business API SaaS
platform for MENA SMBs.

[![n8n.io](https://img.shields.io/badge/community%20node-n8n-FF6D5A)](https://docs.n8n.io/integrations/community-nodes/installation/)
[![npm version](https://img.shields.io/npm/v/n8n-nodes-leadrspace)](https://www.npmjs.com/package/n8n-nodes-leadrspace)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

> **v1 scope** — one trigger node, four event types, manual webhook URL setup. v1 does not
> ship credentials or signature verification. See the [Roadmap](#roadmap) for what's coming
> next.

---

## Installation

### Inside n8n Cloud or n8n Desktop

1. Open **Settings → Community Nodes** in n8n.
2. Click **Install a community node**.
3. Enter `n8n-nodes-leadrspace` and confirm.
4. After installation, the **Leadr Space Trigger** node will appear in the node picker
   under the **Trigger** category.

### Local / self-hosted n8n (npm install)

From your n8n custom-nodes directory (default `~/.n8n/nodes/`):

```bash
npm install n8n-nodes-leadrspace
```

Then restart n8n.

### Local development against this repo

```bash
git clone https://github.com/leadr-space/n8n-nodes-leadrspace.git
cd n8n-nodes-leadrspace
npm install
npm run build
npm link

# In your n8n custom-nodes directory:
cd ~/.n8n/nodes
npm link n8n-nodes-leadrspace

# Restart n8n
```

---

## Connect Leadr Space to n8n

The trigger node receives webhooks **but does not register them** with Leadr Space
automatically in v1. You paste the URL once on the Leadr Space side. The full flow:

1. In n8n, create a new workflow.
2. Add the **Leadr Space Trigger** node (search for "Leadr").
3. In the node panel, tick which **Events** you want to react to (see
   [Event Reference](#event-reference)).
4. **Copy the production webhook URL** shown at the top of the node panel.
5. Open the **Leadr Space dashboard → Webhooks** settings page.
6. Click **Add webhook**. Paste the URL.
7. On the Leadr Space side, tick the same event types you ticked in n8n (Leadr Space sends
   only the events you select here; the node additionally filters at receive time).
8. Save the webhook in Leadr Space.
9. Back in n8n, **activate the workflow**.

After activation, every selected event in your Leadr Space account triggers one workflow
execution.

### Discovering payload shape with "Listen for test event"

Before activating the workflow, you can preview the exact JSON shape Leadr Space delivers:

1. Open the trigger node.
2. Click **Listen for test event** in the n8n editor toolbar.
3. n8n shows a temporary **test webhook URL**. Paste this URL into your Leadr Space
   dashboard's Webhooks settings (replace the production URL temporarily, or add it as a
   second test webhook).
4. Trigger an event in Leadr Space (e.g. send a WhatsApp message to your connected number).
5. The node's output panel populates with the actual JSON payload. You can now reference
   fields like `{{ $json["event-type"] }}` or
   `{{ $json.data.value.messages[0].text.body }}` in downstream nodes.
6. Switch back to the production URL in Leadr Space and activate the workflow.

---

## Event Reference

The node supports four event types in v1. The `event-type` field is the top-level
discriminator on every payload.

| Event value         | UI label          | When it fires                                                |
|---------------------|-------------------|--------------------------------------------------------------|
| `message.received`  | Message Received  | An inbound WhatsApp message arrives from a customer.         |
| `message.sent`      | Message Sent      | An outbound WhatsApp message is sent by a user or automation.|
| `contact.created`   | Contact Created   | A new contact is added to your Leadr Space account.          |
| `contact.updated`   | Contact Updated   | An existing contact's fields are changed.                    |

### Payload shapes

**`contact.created` / `contact.updated`** — flat object:

```json
{
  "uuid": "312d1353-46ad-4ba0-b25f-0de10fd7e80f",
  "first_name": "Example",
  "last_name": "01",
  "full_name": "Example 01",
  "phone": "+212600010203",
  "formatted_phone_number": "+212 6 00 01 02 03",
  "email": null,
  "created_at": "2026-05-15 14:49:00",
  "updated_at": "2026-05-15 14:49:00",
  "address": "{\"street\":null,\"city\":null,...}",
  "metadata": "{\"Call number\":null,...}",
  "event-type": "contact.created"
}
```

**`message.received`** — WhatsApp Cloud API envelope nested under `data.value`:

```json
{
  "data": {
    "value": {
      "messaging_product": "whatsapp",
      "metadata": { "display_phone_number": "...", "phone_number_id": "..." },
      "contacts": [{ "profile": { "name": "..." }, "wa_id": "..." }],
      "messages": [
        {
          "from": "...",
          "id": "wamid....",
          "timestamp": "...",
          "type": "image",
          "image": { "caption": "...", "mime_type": "image/jpeg", "id": "...", "url": "..." }
        }
      ]
    },
    "field": "messages"
  },
  "event-type": "message.received"
}
```

**`message.sent`** — outbound send result under `data.data`:

```json
{
  "data": {
    "success": true,
    "data": {
      "messaging_product": "whatsapp",
      "messages": [{ "id": "wamid...." }],
      "chat": { "id": 0, "uuid": "...", "type": "outbound", "status": "delivered", "contact": { /* full contact */ } }
    }
  },
  "event-type": "message.sent"
}
```

Reference fixtures live in [`webhooks-examples/`](./webhooks-examples) at the repository
root.

---

## Example workflows

### React to inbound WhatsApp messages (`message.received`)

```text
[Leadr Space Trigger (message.received)] → [Switch on $json.data.value.messages[0].type]
                                              ├─ text   → [Slack: post to #support]
                                              ├─ image  → [Google Drive: upload]
                                              └─ other  → [No-op]
```

### Log every outbound send (`message.sent`)

```text
[Leadr Space Trigger (message.sent)] → [Set: extract chat id, status, contact phone]
                                     → [Google Sheets: append row]
```

### Sync new contacts to your CRM (`contact.created`)

```text
[Leadr Space Trigger (contact.created)] → [HubSpot / Pipedrive: create contact]
```

### Detect contact updates (`contact.updated`)

```text
[Leadr Space Trigger (contact.updated)] → [Function: diff against previous run]
                                        → [Notion: update database row]
```

---

## Security

⚠️ **v1 does not authenticate inbound webhooks.** Specifically:

- There is no HMAC signature verification.
- There is no API key credential.
- The **production webhook URL is the only access secret.** Anyone who learns the URL can
  POST forged payloads to your workflow.

**Recommendations**:

- Do not paste the webhook URL into screenshots, public chats, public dashboards, or
  third-party services other than the Leadr Space dashboard itself.
- If the URL leaks (or if you suspect it has), rotate it: delete the workflow's webhook
  path (the URL changes on the next workflow you create) and update the Leadr Space
  dashboard with the new URL.
- For destructive downstream actions (charging customers, sending messages, deleting
  records), wait for v1.1 which adds HMAC signature verification.

---

## Deduplication

Leadr Space delivers webhooks **at least once** — the same event may arrive twice on retry.
The trigger emits every delivery whose `event-type` is in your selected list; it does not
deduplicate.

If your downstream logic is non-idempotent, deduplicate using the per-event unique id:

| Event                            | Suggested dedup key                  |
|----------------------------------|--------------------------------------|
| `contact.created` / `contact.updated` | `{{ $json.uuid }}`            |
| `message.received` / `message.sent` | `{{ $json.data.value.messages[0].id }}` (received) or `{{ $json.data.data.messages[0].id }}` (sent) |

A simple pattern is to feed the dedup key into n8n's **If** node against a recent-ids set
stored in a database or KV cache, or use the n8n **Schedule + dedupe** community node.

---

## Roadmap

The following are deliberately deferred from v1 and are tracked on the v1.1 milestone:

- **HMAC signature verification** on inbound deliveries — closes the URL-as-secret gap.
- **Timestamp + replay protection** (≈5-minute freshness window).
- **API key credentials** stored via n8n's encrypted credential mechanism.
- **Automatic webhook registration** on workflow activation (no more manual paste).
- **Automatic webhook removal** on workflow deactivation or deletion.

Further deferred (v2+):

- Action nodes (send message, send template, create contact, update contact, …).
- Additional event types: `message.status.update`, `contact.deleted`, `group.*`,
  `auto_reply.*`, `lead.created`, `product.created`.
- OAuth2 authentication.

---

## Resources

- [Leadr Space API documentation](https://leadr.space/docs) <!-- TODO: update link when public docs are live -->
- [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/)
- [GitHub repository](https://github.com/leadr-space/n8n-nodes-leadrspace)
- [Report a bug](https://github.com/leadr-space/n8n-nodes-leadrspace/issues)

---

## License

[MIT](./LICENSE) © 2026 Leadr Space
