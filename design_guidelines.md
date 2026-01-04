# ErPrana Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app handles sensitive health data, multi-device sync, and personalized medical information.

**Implementation:**
- SSO with Apple Sign-In (iOS) and Google Sign-In (Android/cross-platform)
- Two-tier onboarding:
  1. Account creation with role selection (Layperson/Doctor)
  2. Health profile setup (optional skip for immediate access)
- Include privacy policy, HIPAA compliance statement, and terms of service
- Account screen features:
  - User role badge (Layperson/Doctor)
  - Switch mode option
  - Log out (with data sync confirmation)
  - Delete account (Settings > Account > Delete Account, double confirmation with health data warning)

### Navigation
**Tab Navigation** - 5 tabs with center action button:

1. **Dashboard** (Home) - Daily health overview, wearables data
2. **Records** - Health history, medications, past consultations
3. **ARYA** (Center FAB) - AI symptom checker (core action)
4. **Medications** - Med list, reminders, adherence tracking
5. **Profile** - Settings, wearables sync, emergency contacts

**Special Flows:**
- SOS button: Global floating button (top-right on all screens except ARYA chat)
- Doctor Mode: Unlocks additional features in Dashboard and Records tabs

---

## Screen Specifications

### 1. Dashboard (Home)
**Purpose:** At-a-glance health status with daily insights

**Layout:**
- Header: Transparent, greeting text (e.g., "Good morning, [Name]"), SOS button (right), notification bell (left)
- Main content: ScrollView
  - Hero card: Today's health score/summary with trend indicator
  - Wearables sync status card (if not connected: prominent CTA)
  - Vitals grid (4-6 key metrics: heart rate, steps, sleep, etc.)
  - Recent ARYA insights (collapsible list)
  - Medication reminders for today
- Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

**Components:** Status cards, metric tiles, sync prompt banner, collapsible sections

---

### 2. Health Records
**Purpose:** Comprehensive medical history management

**Layout:**
- Header: Standard opaque, title "Health Records", search icon (right), filter icon (left)
- Main content: Segmented control tabs
  - Medical History (PMHx, surgeries, allergies)
  - Consultations (past ARYA sessions, doctor notes)
  - Test Results (labs, imaging)
  - Immunizations
- Each tab: List with grouped sections by date/category
- Floating FAB: "Add Record" button (bottom-right)
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl + 64 (FAB clearance)

**Components:** Segmented control, grouped lists, search bar, date pickers, file upload interface

---

### 3. ARYA Symptom Checker (Modal)
**Purpose:** Conversational AI health assessment

**Layout:**
- Full-screen modal presentation
- Header: Transparent with gradient fade, "ARYA" title (center), close button (left), options menu (right: save, share transcript)
- Main content: Chat interface (inverted FlatList)
  - Greeting message on first launch: "I'm ARYA, your health assistant. Describe your symptoms, and I'll help assess the situation."
  - User messages: Right-aligned bubbles (accent color)
  - ARYA messages: Left-aligned bubbles (neutral background)
  - Typing indicator during response
  - Emergency alert banner (if detected): Red banner with "Seek immediate care" + call 911 button
- Input area: Fixed bottom bar
  - Text input with multiline support
  - Voice input button (left)
  - Send button (right)
- Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl (input bar floats above)

**Components:** Chat bubbles, input toolbar, voice recording UI, emergency alert banner, typing indicator

---

### 4. Medications
**Purpose:** Medication management and adherence tracking

**Layout:**
- Header: Standard opaque, "Medications", add button (right), calendar filter (left)
- Main content: Two sections
  - Active Medications (List): Each item shows name, dosage, schedule, next dose time, adherence streak
  - Past Medications (Collapsible)
- Reminder cards: Time-based grouping (Morning, Afternoon, Evening, Night)
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl

**Components:** Medication list items with checkbox, schedule chips, adherence progress rings, time-grouped cards

**Add/Edit Medication Screen (Stack Modal):**
- Form layout: ScrollView with keyboard-aware behavior
- Fields: Name, dosage, frequency, start/end date, reminder times, notes
- Submit/Cancel: Header buttons (Save right, Cancel left)
- Safe area: top = Spacing.xl, bottom = insets.bottom + Spacing.xl

---

### 5. Profile & Settings
**Purpose:** User preferences, wearables, emergency setup

**Layout:**
- Header: Standard opaque, "Profile"
- Main content: ScrollView with sections
  - User info card: Avatar (tap to change), name, role badge, edit button
  - Wearables & Devices (list of connected devices with sync status)
  - Emergency Contacts (add/edit)
  - Health Profile (age, gender, blood type, allergies - quick view)
  - Preferences (notifications, units, language)
  - Mode Switch (Layperson ↔ Doctor)
  - Privacy & Safety
  - Account (nested: Log out, Delete account)
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl

**Components:** Profile card, settings list, toggle switches, device sync status indicators

---

### 6. SOS / Emergency Screen (Modal)
**Purpose:** Quick emergency action

**Layout:**
- Full-screen modal, red theme
- Header: "Emergency" title, close button (if accidental tap)
- Main content: Centered layout
  - Large "Call 911" button
  - "Share Location" button
  - Emergency contacts quick dial list
  - Medical ID summary (allergies, conditions, medications)
- Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl

**Components:** Emergency action buttons, contact list, medical ID card

---

## Design System

### Color Palette
- **Primary (Accent):** Medical blue (#2563EB) - trust, calm
- **Success:** Green (#10B981) - healthy metrics, adherence
- **Warning:** Amber (#F59E0B) - caution, moderate risk
- **Danger:** Red (#EF4444) - emergency, critical alerts
- **Neutral Background:** Light gray (#F9FAFB) for cards
- **Text Primary:** Dark gray (#1F2937)
- **Text Secondary:** Medium gray (#6B7280)

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto (Android), Bold, 24-28pt
- **Body:** SF Pro Text / Roboto, Regular, 16pt, line height 1.5
- **Small/Labels:** 14pt, Medium weight
- **Metric Values:** Tabular numbers, 32pt for key stats

### Spacing
- xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32

### Component Behavior
- All touchables: 0.7 opacity on press
- Cards: Subtle border (1px, neutral-200), rounded corners (12px)
- Floating FAB: Drop shadow (offset: 0/2, opacity: 0.10, radius: 2)
- Form inputs: Focused state with primary border, error state with danger border
- Loading states: Skeleton screens for data-heavy views, spinners for actions

---

## Visual Design

### Icons
- Use SF Symbols (iOS) / Material Icons (Android)
- Tab bar: heart.fill (Dashboard), doc.text.fill (Records), waveform.heart (ARYA - FAB), pills.fill (Medications), person.crop.circle (Profile)
- SOS: exclamation.triangle.fill in red circle
- NO emojis in production UI

### Critical Assets
1. **ARYA avatar:** Minimalist medical assistant icon (circular, gradient blue/teal)
2. **Wearable device icons:** Apple Watch, Fitbit, Garmin logos (official brand assets required)
3. **Mode badges:** "Layperson" and "Doctor" distinctive badges
4. **Empty states:** Custom illustrations for no data (medications, records, wearables not connected)
5. **Onboarding illustrations:** 3-4 screens explaining ARYA, privacy, wearables

### Accessibility
- All text minimum 16pt, support Dynamic Type
- Color contrast ratio ≥ 4.5:1 for body text, 3:1 for large text
- Voice input and output for ARYA (accessibility feature)
- Emergency features accessible via Voice Control/TalkBack
- Red/green color blindness: use icons + text labels for status

---

## Special Considerations
- **Medical Disclaimer:** Footer in ARYA chat: "ARYA is not a replacement for professional medical advice"
- **Data Privacy Banner:** First-time wearables sync requires explicit consent
- **Emergency Detection:** Visual + haptic feedback when ARYA detects critical symptoms
- **Offline Mode:** Dashboard and Records accessible offline with sync indicator
- **Confirmation Dialogs:** Required for medication deletion, emergency contact changes, account deletion