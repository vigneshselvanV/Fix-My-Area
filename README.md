<div align="center">

# 🏙️ FixMyArea

**Civic Issue Reporting — Transparent. Intelligent. Community-Driven.**

Report local civic issues in under 2 minutes. AI-powered risk triage, real-time tracking, and transparent resolution for cleaner, safer neighbourhoods.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.1.0-orange.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-Powered-4285F4?logo=google&logoColor=white)

[Live Demo](https://fixmyarea.ai.studio) · [Report Bug](https://github.com/vigneshselvanV/fixmyarea/issues) · [Request Feature](https://github.com/vigneshselvanV/fixmyarea/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Demo](#-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact / Author](#-contact--author)

---

## 🔍 Overview

**FixMyArea** is a civic issue-reporting web application that empowers residents to report neighbourhood problems — potholes, garbage dumps, broken streetlights, water leaks, drainage failures, and stray animals — while giving local authorities a powerful admin dashboard to triage, track, and resolve them.

### Why FixMyArea?

| Problem | Solution |
|---|---|
| Civic complaints go untracked | Every report gets a real-time status lifecycle: **Reported → Acknowledged → In Progress → Resolved** |
| Duplicate reports overwhelm authorities | AI-powered **duplicate detection** clusters nearby identical issues |
| No prioritisation framework | **Gemini AI risk assessment** auto-classifies severity as Low / Medium / High / Critical |
| Residents feel unheard | **Upvoting, commenting, and community leaderboards** drive civic engagement |
| No accountability or transparency | **SLA tracking, analytics dashboards, and status history audits** keep everyone honest |

---

## 🎬 Demo

🔗 **Live App:** [fixmyarea.ai.studio](https://fixmyarea.ai.studio)

<!-- Add screenshots or GIFs here -->
<!-- ![Dashboard Preview](assets/screenshots/dashboard.png) -->
<!-- ![Map View](assets/screenshots/map-view.png) -->

---

## ✨ Features

### For Residents
- 📸 **Quick Report Filing** — Submit an issue with photo, GPS location, and category in under 2 minutes
- 🤖 **AI Photo Verification** — Gemini Vision validates photo authenticity and detects the hazard type
- 🗺️ **Interactive Map View** — Browse all civic issues on a live Leaflet map with clustered markers
- 🔔 **Real-Time Notifications** — Get in-app alerts when your report status changes
- 👍 **Upvote & Comment** — Community-driven prioritisation of issues that matter most
- 🏆 **Citizen Leaderboard** — Earn points and badges for active civic participation
- 🔍 **Smart Filters** — Filter reports by category, status, risk level, proximity, and sort order

### For Authorities (Admin)
- 🛡️ **Admin Dashboard** — Manage all reports with role-based access control
- 🧠 **AI Risk Triage** — Automated risk-level classification and suggested action plans via Gemini AI
- 📊 **Analytics & Insights** — Daily aggregates, category breakdowns, risk distributions, and resolution metrics
- ⏱️ **SLA Monitoring** — Track resolution deadlines with breach alerts and escalation labels
- 🔗 **Duplicate Detection** — AI identifies and links duplicate reports to reduce noise
- 📢 **Civic Broadcasts** — Push advisories and emergency alerts to all residents
- 📄 **Export Capabilities** — Export report data for offline analysis
- ✅ **Resolution Verification** — Citizens can verify and rate resolved issues with after-photos

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Tailwind CSS 4 |
| **Build Tool** | Vite 6 |
| **Routing** | React Router DOM 7 |
| **Animations** | Motion (Framer Motion) |
| **Icons** | Lucide React |
| **Maps** | Leaflet, Google Maps (via `@vis.gl/react-google-maps`) |
| **Backend / BaaS** | Firebase 12 (Firestore, Auth, Storage) |
| **AI / ML** | Google Gemini AI (`@google/genai`) |
| **Server** | Express.js (API proxy) |
| **Typography** | Montserrat, Source Sans 3 (Google Fonts) |
| **Package Manager** | npm / Bun |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 (or [Bun](https://bun.sh/) as an alternative runtime)
- A **Google Gemini API key** — [Get one here](https://ai.google.dev/)
- A **Firebase project** with Firestore, Authentication, and Storage enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vigneshselvanV/fixmyarea.git
cd fixmyarea

# 2. Install dependencies
npm install
# or
bun install

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env.local` file in the root directory. Refer to [`.env.example`](.env.example) for the template:

```env
# Required — Your Gemini API key for AI-powered features
GEMINI_API_KEY="your_gemini_api_key_here"

# Required — Your OpenRouter API key for AI risk assessment & chatbot
VITE_OPENROUTER_API_KEY="your_openrouter_api_key_here"

# Optional — The URL where this app is hosted (used for callbacks & self-referential links)
APP_URL="http://localhost:3000"
```

> **Note:** When deployed via Google AI Studio, `GEMINI_API_KEY` and `APP_URL` are automatically injected at runtime.

---

## 💡 Usage

### Resident Workflow

```
1. Sign up / Log in  →  Create an account or authenticate via Firebase Auth
2. Report an Issue   →  Select category, snap a photo, describe the problem
3. AI Triage         →  Gemini auto-assesses risk level and suggests actions
4. Track Progress    →  Follow your report through Reported → Acknowledged → In Progress → Resolved
5. Engage            →  Upvote other reports, leave comments, climb the leaderboard
```

### Admin Workflow

```
1. Log in as Admin   →  Access the admin dashboard at /admin
2. Review Reports    →  Sort by risk, filter by category/status, detect duplicates
3. Update Status     →  Transition reports through the resolution lifecycle
4. Broadcast         →  Send civic advisories and emergency alerts
5. Analyse           →  View analytics dashboards for trends and KPIs
```

---

## 📂 Project Structure

```
fixmyarea/
├── index.html                    # App entry point
├── vite.config.ts                # Vite build configuration
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── firestore.rules               # Firestore security rules (RBAC)
├── storage.rules                 # Firebase Storage rules
├── firebase-blueprint.json       # Data model & schema definitions
├── firebase-applet-config.json   # AI Studio Firebase integration
├── metadata.json                 # App metadata & capabilities
├── .env.example                  # Environment variable template
│
└── src/
    ├── main.tsx                  # React DOM mount point
    ├── App.tsx                   # Root component with routing
    ├── index.css                 # Global styles
    │
    ├── components/
    │   ├── layout/               # AppLayout, Navbar, Sidebar
    │   ├── common/               # Reusable UI components
    │   ├── maps/                 # Map-related components
    │   └── ChatWidget.tsx        # AI chatbot widget
    │
    ├── pages/
    │   ├── LandingPage.tsx       # Public landing page
    │   ├── LoginPage.tsx         # Authentication — login
    │   ├── SignupPage.tsx        # Authentication — registration
    │   ├── DashboardPage.tsx     # Main user dashboard
    │   ├── MapViewPage.tsx       # Interactive issue map
    │   ├── CreateReportPage.tsx  # New report form with AI triage
    │   ├── ReportDetailPage.tsx  # Single report view + timeline
    │   ├── AdminPage.tsx         # Admin management console
    │   ├── AnalyticsPage.tsx     # Data visualisation & KPIs
    │   ├── LeaderboardPage.tsx   # Citizen engagement rankings
    │   ├── ProfilePage.tsx       # User profile management
    │   └── SettingsPage.tsx      # App & notification settings
    │
    ├── services/
    │   ├── reports.ts            # CRUD operations for reports
    │   ├── riskAssessment.ts     # Gemini AI risk triage logic
    │   ├── chatbotService.ts     # AI chatbot integration
    │   ├── analytics.ts          # Analytics aggregation
    │   ├── notifications.ts     # Notification dispatch
    │   └── sheetsExportStub.ts   # Data export utilities
    │
    ├── context/
    │   └── AuthContext.tsx        # Firebase Auth provider
    │
    ├── firebase/
    │   └── config.ts             # Firebase SDK initialisation
    │
    └── types/
        └── index.ts              # TypeScript type definitions
```

---

## 🗺️ Roadmap

- [x] Core report CRUD with GPS and photo upload
- [x] Gemini AI risk assessment and suggested actions
- [x] Interactive Leaflet map view
- [x] Role-based access control (Resident / Admin)
- [x] Real-time notifications and status history
- [x] Community upvoting, commenting, and flagging
- [x] Citizen leaderboard with points and badges
- [x] Analytics dashboard with daily aggregates
- [x] AI photo authenticity verification
- [x] SLA tracking and breach detection
- [x] Civic broadcast system
- [x] Resolution feedback and citizen verification
- [ ] Push notifications (FCM)
- [ ] Offline support with service workers (PWA)
- [ ] Multi-language internationalisation (i18n)
- [ ] Dark mode toggle
- [ ] Native mobile app (React Native)
- [ ] Public API for third-party integrations
- [ ] Ward-level geofencing and routing

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

> Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📝 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👤 Contact / Author

**Project Maintainer** — [Vignesh Selvan](https://github.com/vigneshselvanV)

- 🐙 GitHub: [@vigneshselvanV](https://github.com/vigneshselvanV)
- 📧 Email: vigneshselvan2008vvs@gmail.com

---

<div align="center">

**⭐ If FixMyArea helps your community, give it a star on GitHub! ⭐**

Made with ❤️ for cleaner, safer neighbourhoods.

</div>
