# RecoverAI — AI Revenue Recovery Agent

> **Razorpay AI Internship Submission — Track 3: AI Revenue Recovery**

A production-quality frontend web application that helps merchants recover lost revenue from failed payments using an intelligent AI agent.

---

## 📸 Screenshots

> *(After running `npm run dev`, screenshots can be added here)*

---

## 🚀 Features

### Core
- **AI Recovery Agent** — Analyzes failed payments and provides detailed recovery strategies
- **Recovery Probability Engine** — Calculates recovery likelihood based on failure type, customer history, and patterns
- **Recovery Workflow** — Visual 6-stage workflow from failed payment to recovered
- **Personalized Recovery Messages** — AI-generated customer messages per payment
- **Recovery Analytics** — Deep insights into recovery performance and AI effectiveness
- **AI Activity Timeline** — Real-time log of all AI agent decisions

### Dashboard
- Live stats: Total Payments, Failed Payments, Potential Revenue, Recovered Revenue, Recovery Rate
- Revenue Recovery Trend (Area Chart)
- Failure Reasons Distribution (Pie Chart)
- Weekly Recovery Performance (Bar Chart)
- Recent Activity Feed

### Failed Payments
- Searchable, filterable, sortable payment table
- Filter by status, failure reason
- Sort by amount or recovery probability
- Pagination
- Click-to-open payment detail drawer

### AI Recovery Agent (Main Feature)
- Payment selector with recovery probability indicators
- Real-time AI analysis with animated loading state
- Failure analysis, customer reliability assessment
- Recommended action with all alternatives shown
- Best retry time & priority
- Collapsible reasoning view
- Message generator with copy/regenerate/send-test
- 6-stage visual workflow tracker

### Analytics
- Revenue recovery over time
- Recovery rate by failure reason
- Probability distribution chart
- AI performance metrics and strategy breakdown

### Settings
- AI configuration (thresholds, auto-retry, auto-send)
- Notification preferences
- API integration settings
- Security information

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | Core framework |
| Vite | Build tool & dev server |
| Tailwind CSS v3 | Styling |
| React Router v6 | Client-side routing |
| Recharts | Data visualization |
| Lucide React | Icons |
| Axios | HTTP client |
| Zustand | Global state management |

---

## ⚡ Local Setup

### Prerequisites
- Node.js >= 18
- npm >= 9

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd recoverai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL

# 4. Start the development server
npm run dev
```

The app runs at **http://localhost:5173**

> **Note:** If `VITE_API_BASE_URL` is empty or not set, the app automatically falls back to comprehensive mock data so you can demo the full UI without a backend.

---

## 🔧 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Backend API base URL (leave empty to use mock data)
VITE_API_BASE_URL=http://localhost:5000/api
```

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No | Backend API base URL. If empty, uses mock data fallback |

### ⚠️ Security
- **Never** put `GROQ_API_KEY`, `MONGODB_URI`, or any backend secrets in frontend `.env`
- The frontend only communicates with your own backend API
- The backend proxies all AI requests to Groq/LLM

---

## 🔌 API Integration

The frontend expects the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/stats` | Dashboard stats & charts data |
| `GET` | `/payments` | Paginated payment list with filters |
| `GET` | `/payments/:id` | Single payment details |
| `POST` | `/recovery/analyze` | AI analysis for a payment |
| `POST` | `/recovery/message` | Generate recovery message |
| `POST` | `/recovery/start` | Start recovery workflow |
| `GET` | `/analytics` | Analytics data |
| `GET` | `/activity` | AI activity events |

### Request format (analyze)
```json
POST /recovery/analyze
{ "paymentId": "PAY-1024" }
```

### Response format
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY-1024",
    "failureAnalysis": "...",
    "customerReliability": "HIGH",
    "recoveryProbability": 87,
    "recommendedAction": "RETRY_PAYMENT",
    "bestRetryTime": "7:30 PM",
    "priority": "HIGH",
    "reasoning": "...",
    "confidenceScore": 92,
    "suggestedMessage": "...",
    "analysisTimestamp": "...",
    "agentVersion": "RecoverAI v2.1"
  }
}
```

---

## 📁 Project Structure

```
recoverai/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx        # Root layout
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   └── Topbar.tsx        # Top navigation bar
│   │   ├── payments/
│   │   │   └── PaymentDetailDrawer.tsx
│   │   └── ui/
│   │       ├── index.tsx         # StatCard, ChartCard, badges, etc.
│   │       └── Toast.tsx         # Toast notification system
│   ├── pages/
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   ├── Payments.tsx          # Failed payments table
│   │   ├── RecoveryAgent.tsx     # AI Recovery Agent (main feature)
│   │   ├── Analytics.tsx         # Recovery analytics
│   │   ├── Activity.tsx          # AI activity timeline
│   │   └── Settings.tsx          # Configuration
│   ├── services/
│   │   ├── api.ts                # Axios API layer
│   │   └── mockData.ts           # Demo data fallback
│   ├── store/
│   │   └── appStore.ts           # Zustand global state
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🏗 Deployment

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 🎯 Internship Context

This project is submitted for:
- **Company:** Razorpay
- **Track:** 3 — AI Revenue Recovery
- **Role:** AI Engineering Intern

The application demonstrates:
1. A practical understanding of payment failure patterns
2. AI-driven decision making for recovery strategies
3. Production-quality fintech UI/UX
4. Clean TypeScript code architecture
5. Real-world API integration design

---

*Built with ❤️ for the Razorpay AI Internship Program*
