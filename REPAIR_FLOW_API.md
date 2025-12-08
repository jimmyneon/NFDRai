# Repair Flow API

Multi-purpose chat API that handles guided repair flows for the website widget.

## Overview

The `/api/webchat` endpoint now supports two modes:

1. **Standard Chat** - Free-form conversation with AI Steve
2. **Repair Flow** - Guided journey through device selection, issue identification, and booking

## Request Format

### Repair Flow Request

```json
{
  "type": "repair_flow",
  "session_id": "uuid-string",
  "message": "User's text message or selection",
  "context": {
    "page": "start-repair",
    "step": "greeting | device_selected | issue_selected | final | question",
    "device_type": "iphone | ipad | samsung | macbook | laptop | ps5 | ps4 | xbox | switch | null",
    "device_model": "iPhone 14 Pro | null",
    "issue": "screen | battery | charging | water | etc | null",
    "selected_job": "screen_repair | null"
  }
}
```

### Response Format

```json
{
  "type": "repair_flow_response",
  "session_id": "uuid-string",
  "messages": [
    "Hi! I'm Steve, your AI repair assistant. 👋",
    "What device do you need help with today?"
  ],
  "scene": {
    "device_type": "iphone",
    "device_name": "iPhone 14 Pro",
    "device_image": "/images/devices/iphone-14-pro.png",
    "device_summary": "iPhone 14 Pro – Screen Repair",
    "jobs": [
      {
        "id": "screen",
        "label": "Screen Repair",
        "price": "From £89",
        "time": "45 mins"
      },
      {
        "id": "battery",
        "label": "Battery Replacement",
        "price": "From £49",
        "time": "30 mins"
      }
    ],
    "selected_job": "screen",
    "price_estimate": "From £89",
    "show_book_cta": true
  },
  "quick_actions": [
    { "icon": "fa-calendar-check", "label": "Book Now", "value": "book" },
    { "icon": "fa-phone", "label": "Call Us", "value": "call" },
    {
      "icon": "fa-question-circle",
      "label": "Ask a Question",
      "value": "question"
    }
  ],
  "morph_layout": true
}
```

## Conversation Flow

### Step 1: Greeting (Initial Load)

**Request:**

```json
{
  "type": "repair_flow",
  "message": "__init__",
  "context": { "step": "greeting", "device_type": null }
}
```

**Response:**

```json
{
  "messages": [
    "Hi! I'm Steve, your AI repair assistant. 👋",
    "What device do you need help with today?"
  ],
  "scene": null,
  "quick_actions": [
    { "icon": "fa-apple", "label": "iPhone", "value": "iphone" },
    { "icon": "fa-tablet-screen-button", "label": "iPad", "value": "ipad" },
    { "icon": "fa-mobile-alt", "label": "Samsung", "value": "samsung" },
    { "icon": "fa-laptop", "label": "MacBook", "value": "macbook" },
    { "icon": "fa-laptop", "label": "Laptop", "value": "laptop" },
    { "icon": "fa-gamepad", "label": "PlayStation", "value": "playstation" },
    { "icon": "fa-gamepad", "label": "Xbox", "value": "xbox" },
    { "icon": "fa-gamepad", "label": "Switch", "value": "switch" }
  ],
  "morph_layout": false
}
```

### Step 2: Device Selected

**Request:**

```json
{
  "type": "repair_flow",
  "message": "iPhone",
  "context": { "step": "device_selected", "device_type": "iphone" }
}
```

**Response:**

```json
{
  "messages": ["Great! An iPhone. What seems to be the problem?"],
  "scene": {
    "device_type": "iphone",
    "device_name": "iPhone",
    "device_image": "/images/devices/iphone-generic.png",
    "device_summary": "iPhone",
    "jobs": [
      { "id": "screen", "label": "Screen Repair", "price": "From £49" },
      { "id": "battery", "label": "Battery Replacement", "price": "From £39" },
      { "id": "charging", "label": "Charging Port", "price": "From £45" },
      { "id": "back-glass", "label": "Back Glass", "price": "From £59" },
      { "id": "camera", "label": "Camera Repair", "price": "From £55" },
      { "id": "water", "label": "Water Damage", "price": "From £50" }
    ],
    "selected_job": null,
    "price_estimate": null,
    "show_book_cta": false
  },
  "quick_actions": [
    { "icon": "fa-mobile-screen", "label": "Screen Repair", "value": "screen" },
    { "icon": "fa-battery-half", "label": "Battery", "value": "battery" },
    { "icon": "fa-plug", "label": "Charging Port", "value": "charging" },
    {
      "icon": "fa-question-circle",
      "label": "Something else",
      "value": "other"
    }
  ],
  "morph_layout": true
}
```

### Step 3: Issue Selected

**Request:**

```json
{
  "type": "repair_flow",
  "message": "Screen Repair",
  "context": {
    "step": "issue_selected",
    "device_type": "iphone",
    "issue": "screen"
  }
}
```

**Response:**

```json
{
  "messages": [
    "Screen repair - no problem! We do these all the time. 💪",
    "The typical price is from £49 depending on your iPhone model. Most screen repairs are done in 45 mins!",
    "Would you like to book this repair, or do you have any questions?"
  ],
  "scene": {
    "device_type": "iphone",
    "device_name": "iPhone",
    "device_image": "/images/devices/iphone-generic.png",
    "device_summary": "iPhone – Screen Repair",
    "jobs": [...],
    "selected_job": "screen",
    "price_estimate": "From £49",
    "show_book_cta": true
  },
  "quick_actions": [
    { "icon": "fa-calendar-check", "label": "Book Now", "value": "book" },
    { "icon": "fa-phone", "label": "Call Us", "value": "call" },
    { "icon": "fa-question-circle", "label": "Ask a Question", "value": "question" }
  ],
  "morph_layout": true
}
```

### Step 4: Free-text Questions

**Request:**

```json
{
  "type": "repair_flow",
  "message": "How long will it take?",
  "context": {
    "step": "question",
    "device_type": "iphone",
    "issue": "screen"
  }
}
```

**Response:**

```json
{
  "messages": [
    "Most iPhone screen repairs take 30-45 minutes. You can wait in our shop or pop back later!"
  ],
  "scene": null,
  "quick_actions": null,
  "morph_layout": false
}
```

## Supported Devices

| Device Type | Name            | Common Repairs                                       |
| ----------- | --------------- | ---------------------------------------------------- |
| `iphone`    | iPhone          | Screen, Battery, Charging, Back Glass, Camera, Water |
| `ipad`      | iPad            | Screen, Battery, Charging, Camera, Water             |
| `samsung`   | Samsung         | Screen, Battery, Charging, Back Glass, Camera, Water |
| `macbook`   | MacBook         | Screen, Battery, Keyboard, Charging, Water           |
| `laptop`    | Laptop          | Screen, Battery, Keyboard, Charging, Water           |
| `ps5`       | PlayStation 5   | HDMI, Disc Drive, Overheating, Power, Controller     |
| `ps4`       | PlayStation 4   | HDMI, Disc Drive, Overheating, Power, Controller     |
| `xbox`      | Xbox            | HDMI, Disc Drive, Overheating, Power, Controller     |
| `switch`    | Nintendo Switch | Screen, Joy-Con, Charging, Battery, Game Slot        |

## Quick Answers

The API provides instant answers for common questions without AI:

- **Time questions**: "How long will it take?" → Returns repair time estimate
- **Warranty**: "Do you offer warranty?" → Returns warranty info
- **Location**: "Where are you?" → Returns location info
- **Hours**: "When are you open?" → Returns business hours
- **Data safety**: "Is my data safe?" → Returns data safety info

## Files

- `app/lib/repair-flow/types.ts` - TypeScript interfaces
- `app/lib/repair-flow/device-config.ts` - Device configurations and pricing
- `app/lib/repair-flow/handler.ts` - Main flow handler
- `app/lib/repair-flow/index.ts` - Module exports
- `app/api/webchat/route.ts` - API endpoint (updated)

## Testing

```bash
node test-repair-flow.js
```

## Frontend Integration

The frontend should:

1. **Initialize** with `step: "greeting"` on page load
2. **Track context** - Update device_type, issue, selected_job as user progresses
3. **Render scene** - Use scene data to show device image, jobs list, prices
4. **Handle quick_actions** - Show buttons for user to tap
5. **Morph layout** - When `morph_layout: true`, transition to detailed view
6. **Show CTA** - When `show_book_cta: true`, prominently show booking button

## Price Lookup

The API attempts to look up actual prices from the database when a specific device model is provided. Falls back to "From £X" estimates from device config.
