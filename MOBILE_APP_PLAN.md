# 📱 NFD AI Responder - Mobile App Plan (Expo/React Native)

**Platform**: iOS & Android  
**Framework**: Expo (React Native)  
**Status**: Planning Phase  
**Priority**: HIGH - Ultimate Upgrade

---

## 🎯 Vision

A **simple, fast mobile messaging app** that lets staff:
- View all customer conversations in real-time
- Reply to messages instantly
- Take over from AI with one tap
- Get push notifications for new messages
- Work offline with sync when back online

**Think**: WhatsApp for business, but with AI assistance built-in

---

## ✨ Core Features (MVP)

### 1. **Conversation List**
- 📋 All conversations in one scrollable list
- 🔴 Unread message badges
- 🤖 AI/Manual status indicators
- 📱 SMS/WhatsApp/Messenger channel icons
- 🔍 Search conversations
- 🎨 Clean, modern UI

### 2. **Message Thread**
- 💬 WhatsApp-style chat interface
- 👤 Customer messages (left)
- 🤖 AI messages (right, blue)
- 👨‍💼 Staff messages (right, green)
- ⏰ Timestamps
- ✓✓ Read receipts

### 3. **Quick Reply**
- ⌨️ Native keyboard input
- 📝 Message templates
- 😊 Emoji picker
- 🎤 Voice-to-text (optional)
- 📎 Attachments (future)

### 4. **AI Control**
- 🎛️ Toggle AI on/off per conversation
- 🔴 Global kill switch
- 📊 Confidence score display
- ⚡ One-tap takeover

### 5. **Push Notifications**
- 🔔 New message alerts
- 📢 Low confidence warnings
- 🚨 Manual intervention needed
- 🔕 Do Not Disturb mode

### 6. **Offline Support**
- 💾 Cache conversations locally
- 📤 Queue messages when offline
- 🔄 Auto-sync when online
- ⚡ Instant UI updates (optimistic)

---

## 🏗️ Technical Architecture

### Tech Stack
```
Frontend:
- Expo SDK 50+
- React Native
- TypeScript
- React Navigation
- React Query (data fetching)
- Zustand (state management)

Backend:
- Existing Next.js API (no changes needed!)
- Supabase Realtime
- Push Notifications (Expo Push)

Storage:
- AsyncStorage (local cache)
- Supabase (cloud sync)

Authentication:
- Supabase Auth
- Biometric login (Face ID/Touch ID)
```

### App Structure
```
nfd-mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/
│   │   ├── conversations.tsx
│   │   ├── settings.tsx
│   │   └── _layout.tsx
│   ├── conversation/[id].tsx
│   └── _layout.tsx
├── components/
│   ├── ConversationList.tsx
│   ├── MessageBubble.tsx
│   ├── MessageInput.tsx
│   ├── AIStatusBadge.tsx
│   └── NotificationBadge.tsx
├── hooks/
│   ├── useConversations.ts
│   ├── useMessages.ts
│   ├── useRealtime.ts
│   └── usePushNotifications.ts
├── lib/
│   ├── supabase.ts
│   ├── api.ts
│   └── notifications.ts
├── store/
│   └── conversationStore.ts
├── app.json
└── package.json
```

---

## 🎨 UI/UX Design

### Design System
```typescript
// Colors
const colors = {
  primary: '#22c55e',      // Green (brand)
  secondary: '#f5f5dc',    // Ivory
  accent: '#eab308',       // Gold
  aiMessage: '#3b82f6',    // Blue
  staffMessage: '#22c55e', // Green
  customerMessage: '#e5e7eb', // Gray
  background: '#ffffff',
  text: '#1f2937',
}

// Typography
const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  bold: 'Inter-Bold',
}

// Spacing (4px grid)
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}
```

### Screen Mockups

#### 1. Conversation List
```
┌─────────────────────────────┐
│  NFD AI Responder      🔔3  │
├─────────────────────────────┤
│  🔍 Search conversations... │
├─────────────────────────────┤
│  📱 John Smith          2m  │
│  🤖 How much for screen?    │
│  ●●                      🟢 │ ← AI Auto
├─────────────────────────────┤
│  💬 Sarah Jones         5m  │
│  👤 I'll take it!           │
│                          🟡 │ ← Manual
├─────────────────────────────┤
│  📱 Mike Brown         10m  │
│  🤖 Thanks for your help    │
│                          🟢 │
└─────────────────────────────┘
```

#### 2. Message Thread
```
┌─────────────────────────────┐
│  ← John Smith          🎛️  │
│  📱 SMS • 🟢 AI Auto        │
├─────────────────────────────┤
│                             │
│  ┌─────────────────┐        │
│  │ How much for    │  10:30 │
│  │ iPhone screen?  │        │
│  └─────────────────┘        │
│                             │
│        ┌─────────────────┐  │
│  10:31 │ iPhone 14 screen│  │
│        │ is £149.99      │🤖│
│        └─────────────────┘  │
│                             │
│  ┌─────────────────┐        │
│  │ Can I get a     │  10:32 │
│  │ discount?       │        │
│  └─────────────────┘        │
│                             │
├─────────────────────────────┤
│  💬 Type a message...    😊 │
│  [Take Over] [Templates]    │
└─────────────────────────────┘
```

#### 3. Settings
```
┌─────────────────────────────┐
│  Settings                   │
├─────────────────────────────┤
│  AI Automation              │
│  ────────────────────── ✓   │ ← Global toggle
│                             │
│  🔔 Notifications           │
│  • New messages        ✓    │
│  • Low confidence      ✓    │
│  • Manual required     ✓    │
│                             │
│  👤 Account                 │
│  • Profile                  │
│  • Biometric login     ✓    │
│  • Sign out                 │
│                             │
│  ℹ️  About                  │
│  • Version 1.0.0            │
│  • Privacy Policy           │
└─────────────────────────────┘
```

---

## 🚀 Implementation Phases

### Phase 1: Setup & Authentication (Week 1)
**Goal**: Get basic app running with login

**Tasks:**
- [ ] Initialize Expo project
- [ ] Set up TypeScript
- [ ] Configure Expo Router
- [ ] Implement Supabase auth
- [ ] Add login screen
- [ ] Add biometric authentication
- [ ] Test on iOS & Android

**Deliverable**: Working login flow

---

### Phase 2: Conversation List (Week 2)
**Goal**: Display all conversations

**Tasks:**
- [ ] Create conversation list component
- [ ] Fetch conversations from API
- [ ] Implement pull-to-refresh
- [ ] Add search functionality
- [ ] Show unread badges
- [ ] Add status indicators (AI/Manual)
- [ ] Implement navigation to thread

**Deliverable**: Scrollable conversation list

---

### Phase 3: Message Thread (Week 3)
**Goal**: View and send messages

**Tasks:**
- [ ] Create message thread screen
- [ ] Fetch messages for conversation
- [ ] Display message bubbles
- [ ] Implement message input
- [ ] Send messages to API
- [ ] Show AI/Staff/Customer distinction
- [ ] Add timestamps
- [ ] Implement auto-scroll

**Deliverable**: Working chat interface

---

### Phase 4: Real-Time Updates (Week 4)
**Goal**: Live message updates

**Tasks:**
- [ ] Set up Supabase Realtime
- [ ] Subscribe to conversation changes
- [ ] Subscribe to new messages
- [ ] Update UI in real-time
- [ ] Add optimistic updates
- [ ] Handle connection states

**Deliverable**: Live messaging

---

### Phase 5: Push Notifications (Week 5)
**Goal**: Alert users to new messages

**Tasks:**
- [ ] Set up Expo Push Notifications
- [ ] Request notification permissions
- [ ] Store push tokens in database
- [ ] Send notifications from backend
- [ ] Handle notification taps
- [ ] Add notification settings
- [ ] Test on physical devices

**Deliverable**: Working push notifications

---

### Phase 6: AI Controls (Week 6)
**Goal**: Manage AI automation

**Tasks:**
- [ ] Add "Take Over" button
- [ ] Add "Resume AI" button
- [ ] Show confidence scores
- [ ] Implement global kill switch
- [ ] Add confirmation dialogs
- [ ] Update conversation status
- [ ] Show visual feedback

**Deliverable**: Full AI control

---

### Phase 7: Offline Support (Week 7)
**Goal**: Work without internet

**Tasks:**
- [ ] Implement AsyncStorage caching
- [ ] Cache conversations locally
- [ ] Queue outgoing messages
- [ ] Sync when online
- [ ] Show offline indicator
- [ ] Handle conflicts
- [ ] Test offline scenarios

**Deliverable**: Offline-first app

---

### Phase 8: Polish & Testing (Week 8)
**Goal**: Production-ready app

**Tasks:**
- [ ] Add loading states
- [ ] Add error handling
- [ ] Improve animations
- [ ] Add haptic feedback
- [ ] Optimize performance
- [ ] Test on multiple devices
- [ ] Fix bugs
- [ ] User acceptance testing

**Deliverable**: Polished app

---

### Phase 9: App Store Deployment (Week 9)
**Goal**: Publish to stores

**Tasks:**
- [ ] Create app icons
- [ ] Create splash screens
- [ ] Write app descriptions
- [ ] Take screenshots
- [ ] Build iOS app (EAS Build)
- [ ] Build Android app (EAS Build)
- [ ] Submit to App Store
- [ ] Submit to Play Store
- [ ] Beta testing (TestFlight/Internal Testing)

**Deliverable**: Apps in stores

---

## 📦 Quick Start Guide

### 1. Initialize Project
```bash
# Create new Expo app
npx create-expo-app nfd-mobile --template tabs

cd nfd-mobile

# Install dependencies
npx expo install @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store
npx expo install expo-notifications
npx expo install @tanstack/react-query
npx expo install zustand
npx expo install expo-router
```

### 2. Configure Supabase
```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### 3. Create Login Screen
```typescript
// app/(auth)/login.tsx
import { useState } from 'react'
import { View, TextInput, Button, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) alert(error.message)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={signIn} disabled={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
})
```

### 4. Create Conversation List
```typescript
// app/(tabs)/conversations.tsx
import { useEffect, useState } from 'react'
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'

export default function Conversations() {
  const [conversations, setConversations] = useState([])
  const router = useRouter()

  useEffect(() => {
    fetchConversations()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [])

  async function fetchConversations() {
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        customer:customers(*),
        messages(*)
      `)
      .order('updated_at', { ascending: false })
    
    setConversations(data || [])
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push(`/conversation/${item.id}`)}
        >
          <Text style={styles.name}>{item.customer?.name || 'Unknown'}</Text>
          <Text style={styles.preview}>
            {item.messages?.[item.messages.length - 1]?.text}
          </Text>
          <View style={styles.badge}>
            <Text>{item.status === 'auto' ? '🤖' : '👤'}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  preview: {
    color: '#666',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
})
```

---

## 🎯 Key Features Breakdown

### 1. Real-Time Messaging
```typescript
// hooks/useRealtime.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeMessages(conversationId: string, onMessage: (msg: any) => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onMessage(payload.new)
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [conversationId])
}
```

### 2. Push Notifications
```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications'
import { supabase } from './supabase'

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const token = (await Notifications.getExpoPushTokenAsync()).data

  // Save token to database
  const { data: { user } } = await supabase.auth.getUser()
  await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', user?.id)
}

// Handle notification taps
Notifications.addNotificationResponseReceivedListener((response) => {
  const conversationId = response.notification.request.content.data.conversationId
  // Navigate to conversation
})
```

### 3. Offline Queue
```typescript
// lib/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const QUEUE_KEY = 'message_queue'

export async function queueMessage(message: any) {
  const queue = await getQueue()
  queue.push(message)
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export async function processQueue() {
  const queue = await getQueue()
  
  for (const message of queue) {
    try {
      await sendMessage(message)
      // Remove from queue on success
    } catch (error) {
      // Keep in queue, will retry later
    }
  }
}
```

---

## 💰 Cost Estimate

### Development
- **Solo Developer**: 8-10 weeks @ £500/day = £20,000 - £25,000
- **Team (2 devs)**: 4-5 weeks @ £1,000/day = £20,000 - £25,000

### Ongoing
- **Expo EAS Build**: £29/month (unlimited builds)
- **App Store**: £79/year (Apple Developer)
- **Play Store**: £20 one-time (Google Play)
- **Push Notifications**: Free (Expo Push)
- **Hosting**: Already covered (existing backend)

**Total First Year**: ~£25,000 + £500 = £25,500

---

## 📊 Benefits

### For Staff
- ✅ Reply to customers anywhere, anytime
- ✅ Push notifications for urgent messages
- ✅ Faster response times
- ✅ Better work-life balance (handle on-the-go)

### For Business
- ✅ Improved customer satisfaction
- ✅ Faster resolution times
- ✅ Staff can work remotely
- ✅ Professional mobile presence
- ✅ Competitive advantage

### For Customers
- ✅ Faster responses
- ✅ Better service
- ✅ More availability

---

## 🚨 Challenges & Solutions

### Challenge 1: Push Notifications
**Problem**: Complex setup, different for iOS/Android  
**Solution**: Use Expo Push Notifications (handles both)

### Challenge 2: Offline Sync
**Problem**: Message conflicts, data consistency  
**Solution**: Optimistic updates + queue system + conflict resolution

### Challenge 3: Real-Time Performance
**Problem**: Battery drain, data usage  
**Solution**: Websocket connection management, efficient subscriptions

### Challenge 4: App Store Approval
**Problem**: Review process can be slow  
**Solution**: Follow guidelines, use TestFlight for beta

---

## 🎯 MVP Timeline (Fast Track)

### Week 1-2: Core Setup
- Expo project
- Authentication
- Basic UI

### Week 3-4: Messaging
- Conversation list
- Message thread
- Send/receive

### Week 5-6: Real-Time & Notifications
- Live updates
- Push notifications
- AI controls

### Week 7-8: Polish & Deploy
- Bug fixes
- Testing
- App store submission

**Total**: 8 weeks to production

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] Voice messages
- [ ] Image attachments
- [ ] Video calls
- [ ] Customer profiles
- [ ] Analytics dashboard
- [ ] Team chat
- [ ] Canned responses
- [ ] Smart replies (AI suggestions)

### Phase 3 Features
- [ ] iPad/Tablet optimization
- [ ] Apple Watch companion
- [ ] Widget support
- [ ] Siri shortcuts
- [ ] Dark mode
- [ ] Multiple accounts
- [ ] Export conversations

---

## 📱 Alternative: Progressive Web App (PWA)

### If You Want Faster/Cheaper

**Pros:**
- ✅ Faster development (2-3 weeks)
- ✅ One codebase (web + mobile)
- ✅ No app store approval
- ✅ Instant updates
- ✅ Lower cost (~£5,000-£10,000)

**Cons:**
- ❌ Limited push notifications (iOS)
- ❌ No biometric auth
- ❌ Less native feel
- ❌ Requires browser

**Recommendation**: Start with PWA, then native app if needed

---

## 🎬 Next Steps

### Immediate (This Week)
1. **Decide**: Native app (Expo) vs PWA
2. **Budget**: Allocate funds/time
3. **Scope**: MVP features only or full app?

### Short Term (Next Month)
1. **Prototype**: Build basic version
2. **Test**: Internal testing with staff
3. **Iterate**: Based on feedback

### Long Term (3-6 Months)
1. **Launch**: Beta to app stores
2. **Market**: Promote to customers
3. **Scale**: Add features based on usage

---

## 📞 Recommendation

### Start Small: PWA First
**Why:**
- Faster to market (2-3 weeks)
- Lower cost (£5k vs £25k)
- Test demand
- Validate features
- No app store hassle

### Then: Native App
**When:**
- PWA proves valuable
- Staff love it
- Need push notifications
- Want professional polish

---

## ✅ Summary

**Vision**: WhatsApp-style mobile app for managing AI customer conversations  
**Platform**: Expo (React Native) for iOS & Android  
**Timeline**: 8 weeks MVP  
**Cost**: £25,000 development + £500/year ongoing  
**Alternative**: PWA in 2-3 weeks for £5,000-£10,000  

**Recommendation**: Start with PWA, upgrade to native app if successful

---

**Ready to build?** Let me know and I can start with either:
1. **PWA version** (quick win)
2. **Expo native app** (ultimate upgrade)

---

**Last Updated**: November 3, 2025  
**Status**: Planning Complete - Ready to Build
