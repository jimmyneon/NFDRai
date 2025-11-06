# Test Guide - Conversation Dialog Improvements

## Quick Test Checklist

### Test 1: Auto-Scroll on Open
1. ✅ Open the dashboard
2. ✅ Click on a conversation with many messages (50+)
3. ✅ **Expected:** Dialog opens with the newest messages visible at the bottom
4. ✅ **Expected:** No need to scroll down manually

### Test 2: Realtime New Messages
1. ✅ Open a conversation dialog
2. ✅ Send a test message via API (see command below)
3. ✅ **Expected:** New message appears in the dialog automatically
4. ✅ **Expected:** Dialog smoothly scrolls to show the new message

### Test 3: Conversation List Updates
1. ✅ View the conversations list
2. ✅ Send a test message via API
3. ✅ **Expected:** Conversation list updates immediately
4. ✅ **Expected:** Conversation with new message moves to top

### Test 4: Multiple Messages
1. ✅ Open a conversation dialog
2. ✅ Send 3-5 messages quickly via API
3. ✅ **Expected:** All messages appear in realtime
4. ✅ **Expected:** Dialog scrolls smoothly to show each new message

## Test Commands

### Send Test Message
```bash
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "from": "+447700900000",
    "message": "Test message at '$(date +%H:%M:%S)'",
    "channel": "sms"
  }'
```

### Send Multiple Messages
```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/messages/incoming \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{\"from\":\"+447700900000\",\"message\":\"Test message $i\",\"channel\":\"sms\"}"
  sleep 2
done
```

### Send Long Message (Test Scroll)
```bash
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "from": "+447700900000",
    "message": "This is a very long message to test scrolling behavior. It contains multiple sentences and should trigger the auto-scroll feature. The dialog should smoothly scroll to show this entire message at the bottom of the conversation.",
    "channel": "sms"
  }'
```

## Visual Checks

### Initial Scroll Behavior
- [ ] Dialog opens instantly at bottom (no visible scrolling animation)
- [ ] Latest message is fully visible
- [ ] No white space below the last message
- [ ] Scroll indicator shows you're at the bottom

### New Message Behavior
- [ ] New message appears without page refresh
- [ ] Smooth scroll animation to new message
- [ ] New message is highlighted or stands out
- [ ] Timestamp updates correctly

### Conversation List
- [ ] New messages update the preview text
- [ ] Message count increments
- [ ] Timestamp updates to "just now"
- [ ] Conversation moves to top of list

## Edge Cases to Test

### 1. Very Long Conversation (100+ messages)
```bash
# Create a conversation with many messages
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/messages/incoming \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{\"from\":\"+447700900000\",\"message\":\"Message $i\",\"channel\":\"sms\"}"
  sleep 0.5
done
```
**Expected:** Dialog still opens at bottom instantly, even with 100+ messages

### 2. Rapid Messages
```bash
# Send 10 messages rapidly
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/messages/incoming \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{\"from\":\"+447700900000\",\"message\":\"Rapid $i\",\"channel\":\"sms\"}" &
done
```
**Expected:** All messages appear, scroll keeps up with new messages

### 3. Different Message Types
```bash
# Customer message
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"from":"+447700900000","message":"Customer message","channel":"sms"}'

# Wait for AI response, then send staff message
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"conversationId":"lookup-by-phone","customerPhone":"+447700900000","text":"Staff reply","sender":"staff","trackOnly":true}'
```
**Expected:** Both message types display correctly with proper styling

### 4. Special Characters
```bash
curl -X POST http://localhost:3000/api/messages/incoming \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"from":"+447700900000","message":"Test £50 with emoji 📱 and German ä ö ü","channel":"sms"}'
```
**Expected:** Special characters display correctly, scroll still works

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Performance Checks

- [ ] Dialog opens quickly (< 500ms)
- [ ] No lag when scrolling manually
- [ ] No memory leaks (check DevTools)
- [ ] Realtime updates don't cause flashing
- [ ] CPU usage stays low

## Troubleshooting

### Dialog doesn't scroll to bottom
1. Check browser console for errors
2. Verify `messagesEndRef` is attached to element
3. Check if CSS `overflow-y: auto` is applied
4. Try hard refresh (Cmd+Shift+R)

### Realtime updates not working
1. Check Supabase realtime is enabled
2. Verify database triggers are set up
3. Check browser console for WebSocket errors
4. Check Network tab for realtime connection

### Scroll is jumpy or laggy
1. Check if there are too many messages (>500)
2. Verify `scroll-smooth` CSS class is applied
3. Check for JavaScript errors
4. Try reducing scroll timeout intervals

## Success Criteria

✅ Dialog opens at bottom in < 500ms
✅ No manual scrolling needed
✅ New messages appear in < 2 seconds
✅ Smooth scroll animation for new messages
✅ Works with 100+ messages
✅ Works in all major browsers
✅ No console errors
✅ Realtime updates reliable
