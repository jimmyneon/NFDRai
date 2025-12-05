# Website Chat Widget Setup - AI Steve

This guide explains how to add AI Steve to your website as a chat widget.

## Overview

The webchat API allows you to embed AI Steve on any website. Visitors can chat with AI Steve just like they would via SMS, getting the same intelligent responses about repairs, pricing, hours, etc.

## Quick Start

### 1. Run the Database Migration

First, apply the migration to add webchat support:

```bash
# In Supabase Dashboard → SQL Editor, run:
# Contents of: supabase/migrations/052_add_webchat_channel.sql
```

### 2. Generate an API Key

In your dashboard, or via API:

```bash
# POST to your API
curl -X POST https://your-app.vercel.app/api/webchat/keys \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{"name": "Website Widget"}'
```

Response:

```json
{
  "success": true,
  "key": {
    "id": "uuid",
    "name": "Website Widget",
    "key_prefix": "nfdr_abc123",
    "full_key": "nfdr_abc123xyz789..."
  },
  "warning": "Save this API key now! It won't be shown again."
}
```

**⚠️ IMPORTANT: Save the `full_key` immediately! It's only shown once.**

### 3. Add the Widget to Your Website

Add this script before `</body>`:

```html
<script>
  (function () {
    // Configuration
    const WEBCHAT_API = "https://your-app.vercel.app/api/webchat";
    const API_KEY = "nfdr_your_api_key_here";

    // Create widget container
    const widget = document.createElement("div");
    widget.id = "ai-steve-widget";
    widget.innerHTML = `
    <style>
      #ai-steve-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #ai-steve-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #2563eb;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      #ai-steve-toggle:hover { transform: scale(1.1); }
      #ai-steve-toggle svg { width: 28px; height: 28px; fill: white; }
      #ai-steve-chat {
        display: none;
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        overflow: hidden;
        flex-direction: column;
      }
      #ai-steve-chat.open { display: flex; }
      #ai-steve-header {
        background: #2563eb;
        color: white;
        padding: 16px;
        font-weight: 600;
      }
      #ai-steve-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      .ai-steve-msg {
        margin-bottom: 12px;
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.4;
      }
      .ai-steve-msg.customer {
        background: #e5e7eb;
        margin-left: auto;
        border-bottom-right-radius: 4px;
      }
      .ai-steve-msg.ai {
        background: #2563eb;
        color: white;
        border-bottom-left-radius: 4px;
      }
      #ai-steve-input-area {
        padding: 12px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }
      #ai-steve-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        outline: none;
      }
      #ai-steve-input:focus { border-color: #2563eb; }
      #ai-steve-send {
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 20px;
        cursor: pointer;
      }
      #ai-steve-send:disabled { opacity: 0.5; }
    </style>
    
    <div id="ai-steve-chat">
      <div id="ai-steve-header">Chat with AI Steve</div>
      <div id="ai-steve-messages"></div>
      <div id="ai-steve-input-area">
        <input type="text" id="ai-steve-input" placeholder="Type your message...">
        <button id="ai-steve-send">Send</button>
      </div>
    </div>
    
    <button id="ai-steve-toggle">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </button>
  `;
    document.body.appendChild(widget);

    // State
    let sessionId = localStorage.getItem("ai_steve_session");
    let isOpen = false;

    // Elements
    const toggle = document.getElementById("ai-steve-toggle");
    const chat = document.getElementById("ai-steve-chat");
    const messages = document.getElementById("ai-steve-messages");
    const input = document.getElementById("ai-steve-input");
    const sendBtn = document.getElementById("ai-steve-send");

    // Toggle chat
    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      chat.classList.toggle("open", isOpen);
      if (isOpen && messages.children.length === 0) {
        addMessage(
          "ai",
          "Hi! I'm AI Steve from New Forest Device Repairs. How can I help you today?"
        );
      }
    });

    // Add message to UI
    function addMessage(sender, text) {
      const msg = document.createElement("div");
      msg.className = "ai-steve-msg " + sender;
      msg.textContent = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    // Send message
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      input.value = "";
      sendBtn.disabled = true;
      addMessage("customer", text);

      try {
        const response = await fetch(WEBCHAT_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
          },
          body: JSON.stringify({
            message: text,
            session_id: sessionId,
            page_url: window.location.href,
            referrer: document.referrer,
          }),
        });

        const data = await response.json();

        if (data.success) {
          sessionId = data.session_id;
          localStorage.setItem("ai_steve_session", sessionId);
          addMessage("ai", data.response);
        } else {
          addMessage("ai", "Sorry, something went wrong. Please try again.");
        }
      } catch (error) {
        addMessage("ai", "Sorry, I couldn't connect. Please try again.");
      }

      sendBtn.disabled = false;
      input.focus();
    }

    // Event listeners
    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  })();
</script>
```

## API Reference

### Send Message

```
POST /api/webchat
```

**Headers:**

- `X-API-Key`: Your API key (required)
- `Content-Type`: application/json

**Body:**

```json
{
  "message": "How much for iPhone screen repair?",
  "session_id": "optional-existing-session",
  "visitor_name": "Optional Name",
  "visitor_email": "optional@email.com",
  "page_url": "https://yoursite.com/page",
  "referrer": "https://google.com"
}
```

**Response:**

```json
{
  "success": true,
  "session_id": "abc123...",
  "conversation_id": "conv-uuid",
  "response": "For iPhone screen repairs, prices typically range from...",
  "metadata": {
    "confidence": 0.95,
    "response_time_ms": 1234,
    "requires_attention": false
  }
}
```

### Get Chat History

```
GET /api/webchat/history?session_id=xxx
```

**Headers:**

- `X-API-Key`: Your API key

**Response:**

```json
{
  "success": true,
  "messages": [
    { "sender": "customer", "text": "Hello", "created_at": "2024-..." },
    { "sender": "ai", "text": "Hi! How can I help?", "created_at": "2024-..." }
  ]
}
```

### Get Widget Settings

```
GET /api/webchat/settings
```

**Headers:**

- `X-API-Key`: Your API key

**Response:**

```json
{
  "success": true,
  "settings": {
    "widget_title": "Chat with AI Steve",
    "welcome_message": "Hi! How can I help?",
    "primary_color": "#2563eb",
    "position": "bottom-right"
  }
}
```

## API Key Management

### List Keys

```
GET /api/webchat/keys
```

### Create Key

```
POST /api/webchat/keys
Body: { "name": "My Widget", "rate_limit_per_minute": 60 }
```

### Delete Key

```
DELETE /api/webchat/keys?id=key-uuid
```

## Security

### Domain Restrictions

You can restrict which domains can use your API key:

1. Go to Supabase Dashboard
2. Find `webchat_settings` table
3. Update `allowed_domains` array: `["yoursite.com", "www.yoursite.com"]`

### Rate Limiting

- Default: 60 requests per minute per IP
- Configurable per API key
- Prevents abuse and spam

### Session Management

- Sessions auto-expire after 30 days of inactivity
- Each visitor gets a unique session
- Sessions persist across page refreshes (stored in localStorage)

## Viewing Webchat Conversations

Webchat conversations appear in your dashboard alongside SMS conversations:

- Channel shows as "webchat"
- Same AI Steve responses
- Same sentiment analysis
- Same staff handoff when needed

## Customization

### Widget Settings (Database)

Update `webchat_settings` table:

| Field                     | Description               | Default                |
| ------------------------- | ------------------------- | ---------------------- |
| `widget_title`            | Header text               | "Chat with AI Steve"   |
| `welcome_message`         | First message shown       | "Hi! I'm AI Steve..."  |
| `placeholder_text`        | Input placeholder         | "Type your message..." |
| `primary_color`           | Theme color (hex)         | "#2563eb"              |
| `position`                | Widget position           | "bottom-right"         |
| `collect_email`           | Ask for email             | false                  |
| `collect_name`            | Ask for name              | false                  |
| `auto_open_delay_seconds` | Auto-open after X seconds | 0 (disabled)           |

### Custom Styling

Override CSS variables in your site's stylesheet:

```css
#ai-steve-widget {
  --primary-color: #your-brand-color;
}
```

## Troubleshooting

### "Invalid API key"

- Check the key is correct and active
- Ensure you're using the full key, not just the prefix

### "Domain not authorized"

- Add your domain to `allowed_domains` in webchat_settings
- Include both www and non-www versions

### "Rate limit exceeded"

- Wait a minute and try again
- Increase `rate_limit_per_minute` in api_keys table

### Messages not appearing in dashboard

- Check the conversation has channel = "webchat"
- Verify the customer was created successfully

## Cost

Same as SMS - uses your existing OpenAI API key:

- ~$0.0001 per message (GPT-4o-mini)
- No additional charges for webchat

## Support

Webchat uses the same AI Steve brain as SMS, so all your existing:

- Pricing data
- Business hours
- FAQ responses
- Sentiment detection
- Staff handoff logic

...works automatically!
