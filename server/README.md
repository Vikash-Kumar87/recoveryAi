# RecoverAI — AI Revenue Recovery Agent (Backend API)

> **Razorpay AI Internship Submission — Track 3: AI Revenue Recovery**

A production-grade backend API and deterministic AI revenue recovery engine built using **Node.js, TypeScript, Express.js, MongoDB Atlas (Mongoose), Groq AI (Llama 3.3), and Zod**.

---

## 📌 Important Prototype & Simulation Disclaimer

> **Notice:** This prototype uses simulated payment failure events and simulated recovery actions for demonstration and technical evaluation. Production deployment would connect real payment events through Razorpay webhooks/APIs. Real transaction funds are not debited or credited in this sandbox environment.

---

## 🎯 Problem & Solution

### The Problem
Payment failures represent a massive leakage in merchant revenue. Traditional retry mechanisms are naive and repetitive—they retry randomly without understanding the root cause (e.g. temporary bank network timeout vs expired card on file), leading to customer frustration and high cart abandonment.

### The Solution
**RecoverAI** combines **deterministic fintech business logic** with **Groq LLM Intelligence (Llama 3.3)** to analyze payment patterns, customer reliability, and failure reasons. It then recommends the optimal recovery strategy (`RETRY_PAYMENT`, `SEND_PAYMENT_LINK`, `SEND_REMINDER`, `WAIT_AND_RETRY`, `MANUAL_REVIEW`), computes realistic recovery probabilities, calculates optimal retry windows, and crafts personalized customer recovery messages.

---

## 🚀 Core Features

1. **Deterministic Recovery Intelligence Engine**:
   - Computes payment history scores (0–100)
   - Calculates historical success ratio (`successfulPayments / totalPayments`)
   - Assesses failure severity (`BANK_TIMEOUT` vs `INSUFFICIENT_FUNDS` vs `CARD_DECLINED` vs `EXPIRED_CARD`)
   - Classifies customer reliability (`HIGH`, `MEDIUM`, `LOW`)
2. **Groq AI Integration**:
   - Model: `llama-3.3-70b-versatile`
   - Strict Zod schema validation
   - Fallback error handling (returns `{ "success": false, "message": "AI analysis is temporarily unavailable. Please try again." }` on rate limits or API outages)
3. **Automated Simulated Recovery Lifecycle**:
   - 6-Stage visual workflow tracking: `Failed Payment` ➔ `AI Analysis` ➔ `Recovery Strategy` ➔ `Customer Outreach` ➔ `Payment Retry` ➔ `Recovered ✓`
4. **Real-time AI Activity Audit Trail**:
   - Chronological logging of all AI decisions, probability calculations, outreach messages, and recovery completions.
5. **Dynamic Aggregation Analytics**:
   - Real-time MongoDB aggregations for revenue recovery trends, failure reasons distribution, and AI strategy success rates.

---

## 🔄 AI Agent Workflow

```
[ Failed Payment Event ]
         │
         ▼
[ Deterministic Business Logic ]
   ├─ Success Ratio Calculation
   ├─ Failure Severity Scoring
   └─ Customer Reliability Score
         │
         ▼
[ Groq AI (Llama 3.3) ]
   ├─ Failure Analysis
   ├─ Probability Score (0-100%)
   ├─ Recommended Action
   ├─ Optimal Retry Time Window
   └─ Personalized Message Generation
         │
         ▼
[ MongoDB Database ("recoveryai") ]
   ├─ Upsert Recovery Record
   ├─ Update Payment Status
   └─ Log AI Activity Audit
         │
         ▼
[ React Frontend Dashboard ]
```

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   React Frontend                         │
│             (Vite + TypeScript + Tailwind)               │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTP / JSON
┌────────────────────────────▼─────────────────────────────┐
│                 Express REST API Backend                 │
│              (TypeScript + Helmet + Morgan)              │
├──────────────────────────────────────────────────────────┤
│  1. Zod Request Validators                               │
│  2. Deterministic Recovery Scoring Engine                │
│  3. Groq LLM Service (llama-3.3-70b-versatile)           │
│  4. Centralized Error & 404 Handlers                     │
├──────────────────────────────────────────────────────────┤
│  5. MongoDB Mongoose ODM (Database: "recoveryai")        │
│     - Payment Collection                                 │
│     - Recovery Collection                                │
│     - Activity Collection                                │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
 ┌──────────────────────┐         ┌──────────────────────┐
 │ MongoDB Atlas Cluster│         │    Groq Cloud API    │
 └──────────────────────┘         └──────────────────────┘
```

---

## 🛠 Technology Stack

- **Runtime:** Node.js (>= 18)
- **Language:** TypeScript 5.7+
- **Framework:** Express.js 4.21+
- **Database & ODM:** MongoDB Atlas / Local MongoDB & Mongoose 8
- **AI / LLM:** Groq SDK (`llama-3.3-70b-versatile`)
- **Validation:** Zod
- **Security & Logging:** Helmet, CORS, Morgan, Dotenv

---

## 🗄 MongoDB Setup

The backend connects to MongoDB Atlas or local MongoDB and explicitly stores all collections in the database:
```
recoveryai
```

### Connection URI:
Set `MONGODB_URI` in `.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/recoveryai?retryWrites=true&w=majority
# Or for local MongoDB:
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=recoveryai
```

---

## 🤖 Groq API Setup

1. Obtain an API key from [Groq Cloud Console](https://console.groq.com/).
2. Add it to `.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```
> **Note:** The Groq API key is strictly kept on the server and is never exposed to the frontend client.

---

## ⚙️ Environment Variables

Create `.env` based on `.env.example`:

```env
# MongoDB Atlas Connection URI
MONGODB_URI=mongodb://localhost:27017

# Explicit Database Name
MONGODB_DB_NAME=recoveryai

# Groq Cloud API Key
GROQ_API_KEY=

# Server Port
PORT=5000

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

---

## 🌱 Seed Database

To populate the `recoveryai` database with **120+ realistic Indian merchant payment records** (INR amounts `₹499`, `₹999`, `₹1499`, `₹2999`, `₹4999`, `₹9999`, `₹24999`), run:

```bash
cd server
npm run seed
```

---

## ⚡ Running Locally

```bash
# 1. Install dependencies
cd server
npm install

# 2. Run in development mode (with hot reload via tsx)
npm run dev

# 3. Build production bundle
npm run build

# 4. Start production server
npm start
```

---

## 🔌 API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status & database connectivity (`{ "success": true, "database": "connected" }`) |
| `GET` | `/api/dashboard/stats` | Dynamic stats, monthly revenue recovery trend, failure reason breakdown, recent activity |
| `GET` | `/api/payments` | Paginated payment list with search, status & failure reason filters, sorting by amount/probability |
| `GET` | `/api/payments/:id` | Detailed payment information with customer transaction history & attached AI analysis |
| `POST` | `/api/recovery/analyze` | Run AI Recovery Agent on a payment (`{ "paymentId": "PAY-1024" }`) |
| `POST` | `/api/recovery/message` | Generate personalized WhatsApp/SMS recovery message |
| `POST` | `/api/recovery/start` | Initiate multi-stage simulated recovery workflow (`{ "paymentId": "PAY-1024" }`) |
| `POST` | `/api/recovery/simulate-success` | Mark payment as recovered in sandbox mode (`{ "paymentId": "PAY-1024" }`) |
| `GET` | `/api/analytics` | Dynamic aggregation metrics, revenue over time, failure reason success rates, AI strategy performance |
| `GET` | `/api/activity` | Paginated real-time AI activity audit trail (`?page=1&limit=20`) |

---

## 💻 Frontend Integration

The React frontend communicates directly with the backend by setting:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
All UI views (Dashboard, Failed Payments, AI Recovery Agent, Analytics, Activity) automatically render live data fetched from MongoDB.

---

## 🎬 Demo Workflow

1. Start backend (`npm run dev` in `/server` on Port `5000`).
2. Start frontend (`npm run dev` in root on Port `5173` or `5174`).
3. Open Dashboard to view live revenue metrics and charts from MongoDB.
4. Go to **Failed Payments** (`/payments`), search or filter by failure reason.
5. Click **"Analyze with AI"** to run live analysis on `POST /api/recovery/analyze`.
6. Click **"Generate Message"** to produce a personalized customer outreach message.
7. Click **"Start Recovery Workflow"** to transition the payment into active simulated recovery.

---

## ⚠️ Limitations & Future Scope

### Current Limitations:
- Payment retries and messages are executed in a high-fidelity simulation sandbox.
- Real bank gateway webhooks are not connected to debit live customer bank accounts.

### Future Scope:
- Integration with Razorpay Webhook Events (`payment.failed`, `payment.authorized`, `subscription.charged`).
- Automatic WhatsApp Business API integration for one-click payment links.
- Reinforcement learning feedback loop to optimize retry times per customer behavioral profile.

---

*Built with ❤️ for the Razorpay AI Internship Program (Track 3 — AI Revenue Recovery)*
