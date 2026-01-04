# ErPrana - Personal Health Assistant

## Overview
ErPrana is a personalized health assistant mobile app featuring ARYA (AI-powered symptom checker), daily health monitoring, medication management, health records tracking, and emergency SOS features. The app supports two user modes: Layperson (Patient) and Doctor.

## Tech Stack
- **Frontend**: React Native with Expo
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o via Replit AI Integrations
- **State Management**: React Query + AsyncStorage

## Project Structure
```
client/
├── components/          # Reusable UI components
├── constants/           # Theme, colors, spacing
├── hooks/              # Custom hooks (useAuth, useTheme)
├── lib/                # Query client, utilities
├── navigation/         # Navigation structure
│   ├── RootStackNavigator.tsx
│   └── MainTabNavigator.tsx
└── screens/            # App screens
    ├── LoginScreen.tsx
    ├── DashboardScreen.tsx
    ├── RecordsScreen.tsx
    ├── MedicationsScreen.tsx
    ├── ProfileScreen.tsx
    ├── AryaScreen.tsx
    ├── SOSScreen.tsx
    ├── AddMedicationScreen.tsx
    └── AddRecordScreen.tsx

server/
├── routes.ts           # API endpoints including ARYA chat
├── db/                 # Database configuration
└── replit_integrations/ # OpenAI integration
```

## Key Features
1. **ARYA AI Symptom Checker**: Structured medical approach (Chief Complaint → Vitals → HPI → PMHx → 9-system review), emergency detection
2. **Dashboard**: Health score, vitals, medication overview, recent insights
3. **Health Records**: Medical history, consultations, test results, immunizations
4. **Medications**: Time-based grouping, dose tracking, reminders
5. **SOS Emergency**: Call 911, share location, emergency contacts, medical ID
6. **User Roles**: Patient and Doctor modes with role-specific features

## Design Guidelines
- Primary Color: Medical Blue (#2563EB)
- Clean, professional medical aesthetic
- iOS 26 liquid glass design influence
- Card-based layout with subtle borders

## Authentication
- Local authentication with AsyncStorage
- Email/password with role selection (Patient/Doctor)
- Auth state persists across sessions

## API Endpoints
- `POST /api/arya/chat` - ARYA AI chat with streaming responses
- `POST /api/chat` - General chat (from template)

## Running the App
- Express backend runs on port 5000
- Expo app runs on port 8081
- Use `npm run server:dev && npm run expo:dev` to start

## Recent Changes
- Initial app setup with full navigation structure
- ARYA AI integration with OpenAI streaming
- Medication tracking with AsyncStorage
- SOS emergency screen with medical ID
