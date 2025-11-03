# Webhook Integration Examples

## API Endpoint

**URL**: `https://your-domain.com/api/messages/incoming`  
**Method**: POST  
**Content-Type**: application/json

## Request Format

```json
{
  "from": "+1234567890",
  "message": "How much for iPhone 14 screen?",
  "channel": "sms",
  "customerName": "John Doe"
}
```

### Required Fields
- `from` - Customer phone number or ID
- `message` - Customer message text
- `channel` - One of: "sms", "whatsapp", "messenger"

### Optional Fields
- `customerName` - Customer's name (will be saved)

## Response Format

```json
{
  "success": true,
  "response": "AI generated response text",
  "confidence": 85,
  "fallback": false
}
```

## Integration Examples

### 1. MacroDroid (Android Automation)

```javascript
// HTTP Request Action Configuration
URL: https://your-domain.com/api/messages/incoming
Method: POST
Content-Type: application/json

Body:
{
  "from": "{sms_number}",
  "message": "{sms_body}",
  "channel": "sms",
  "customerName": "{contact_name}"
}
```

### 2. Twilio (SMS)

```javascript
// Twilio Function
exports.handler = async function(context, event, callback) {
  const response = await fetch('https://your-domain.com/api/messages/incoming', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: event.From,
      message: event.Body,
      channel: 'sms'
    })
  });
  
  const data = await response.json();
  
  const twiml = new Twilio.twiml.MessagingResponse();
  twiml.message(data.response);
  
  callback(null, twiml);
};
```

### 3. Twilio (WhatsApp)

```javascript
// Same as SMS but with channel: 'whatsapp'
exports.handler = async function(context, event, callback) {
  const response = await fetch('https://your-domain.com/api/messages/incoming', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: event.From.replace('whatsapp:', ''),
      message: event.Body,
      channel: 'whatsapp'
    })
  });
  
  const data = await response.json();
  
  const twiml = new Twilio.twiml.MessagingResponse();
  twiml.message(data.response);
  
  callback(null, twiml);
};
```

### 4. Meta Messenger Platform

```javascript
// Messenger Webhook Handler
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;
      const message = webhook_event.message.text;

      // Send to AI Responder
      const response = await fetch('https://your-domain.com/api/messages/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sender_psid,
          message: message,
          channel: 'messenger'
        })
      });

      const data = await response.json();

      // Send response back to Messenger
      await callSendAPI(sender_psid, { text: data.response });
    });

    res.status(200).send('EVENT_RECEIVED');
  }
});
```

### 5. Zapier Integration

```
Trigger: New SMS (via Twilio, etc.)
Action: Webhooks by Zapier
  - Method: POST
  - URL: https://your-domain.com/api/messages/incoming
  - Data:
    {
      "from": "{{phone_number}}",
      "message": "{{message_body}}",
      "channel": "sms"
    }
```

### 6. Make.com (Integromat)

```
Module: HTTP - Make a request
  - URL: https://your-domain.com/api/messages/incoming
  - Method: POST
  - Headers: Content-Type: application/json
  - Body:
    {
      "from": "{{1.phoneNumber}}",
      "message": "{{1.messageText}}",
      "channel": "sms"
    }
```

### 7. Node.js Direct Integration

```javascript
const axios = require('axios');

async function sendToAI(from, message, channel = 'sms') {
  try {
    const response = await axios.post(
      'https://your-domain.com/api/messages/incoming',
      {
        from,
        message,
        channel,
      }
    );

    console.log('AI Response:', response.data.response);
    console.log('Confidence:', response.data.confidence);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage
sendToAI('+1234567890', 'How much for iPhone screen?', 'sms');
```

### 8. Python Integration

```python
import requests

def send_to_ai(from_number, message, channel='sms'):
    url = 'https://your-domain.com/api/messages/incoming'
    
    payload = {
        'from': from_number,
        'message': message,
        'channel': channel
    }
    
    response = requests.post(url, json=payload)
    data = response.json()
    
    print(f"AI Response: {data['response']}")
    print(f"Confidence: {data['confidence']}%")
    
    return data

# Usage
send_to_ai('+1234567890', 'How much for iPhone screen?', 'sms')
```

### 9. cURL Example

```bash
curl -X POST https://your-domain.com/api/messages/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "message": "How much for iPhone 14 screen replacement?",
    "channel": "sms",
    "customerName": "John Doe"
  }'
```

## Testing

### Local Testing (ngrok)

```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose local server
ngrok http 3000

# Use the ngrok URL for webhook testing
# Example: https://abc123.ngrok.io/api/messages/incoming
```

### Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "NFD AI Responder",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Send Message",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"from\": \"+1234567890\",\n  \"message\": \"How much for iPhone 14 screen?\",\n  \"channel\": \"sms\"\n}"
        },
        "url": {
          "raw": "https://your-domain.com/api/messages/incoming",
          "protocol": "https",
          "host": ["your-domain", "com"],
          "path": ["api", "messages", "incoming"]
        }
      }
    }
  ]
}
```

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "error": "Missing required fields: from, message, channel"
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to process message"
}
```

### Retry Logic

```javascript
async function sendWithRetry(payload, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        'https://your-domain.com/api/messages/incoming',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      if (i === maxRetries - 1) throw new Error('Max retries reached');
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

## Security Best Practices

1. **Use HTTPS only** in production
2. **Validate webhook signatures** (if your platform supports it)
3. **Rate limiting** - implement on your webhook sender
4. **IP whitelisting** - restrict to known IPs if possible
5. **Monitor logs** - watch for suspicious activity

## Support

For integration help, see README.md or contact support.
