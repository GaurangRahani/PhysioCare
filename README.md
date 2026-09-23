<div align="center">
  <img src="https://via.placeholder.com/150x150/565ACF/FFFFFF?text=AlignCare" alt="AlignCare Logo" width="120" height="120" style="border-radius: 20px;" />
  
  <h1>AlignCare</h1>
  <p><strong>The modern physiotherapy management platform for clinics and patients.</strong></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#environment-variables">Environment Variables</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/status-production-success.svg" alt="Status: Production" />
    <img src="https://img.shields.io/badge/react-18.x-blue.svg" alt="React" />
    <img src="https://img.shields.io/badge/node.js-Express-green.svg" alt="Node.js" />
    <img src="https://img.shields.io/badge/database-PostgreSQL-blue.svg" alt="PostgreSQL" />
  </p>
</div>

---

## 🚀 Overview

**AlignCare** is a full-stack, production-ready physiotherapy clinic management system designed to bridge the gap between healthcare professionals and patients during the rehabilitation process. 

It replaces traditional paper-based exercise sheets with an interactive, gamified patient portal while giving clinic staff powerful tools to construct customized treatment plans, process payments, and monitor patient adherence in real-time.

---

## ✨ Key Features

### For Patients
* **Interactive Treatment Plans:** View customized daily and weekly exercise routines prescribed by doctors.
* **Progress Tracking:** Gamified progress bars to track daily exercise completion and overall recovery metrics.
* **Self-Booking & Payments:** View available doctor slots and instantly book appointments with integrated **Razorpay** checkout.
* **Seamless Authentication:** Secure login and identity management via **Clerk**.

### For Doctors & Clinic Staff
* **Patient Management:** Track active patient rosters, view individual adherence rates, and monitor reported pain levels.
* **Treatment Plan Builder:** Construct specialized multi-week recovery programs using an internal library of exercises.
* **Role-Based Access Control:** Distinct dashboard views and permissions for **Admins**, **Doctors**, **Receptionists**, and **Patients**.
* **Clinic Configuration:** Centralized admin portal to manage clinic contact information and global settings.

---

## 💻 Tech Stack

### Frontend (Client)
* **Framework:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
* **Routing:** React Router v6
* **Styling:** Custom CSS / CSS Modules
* **Icons:** Lucide React
* **Hosting:** [Vercel](https://vercel.com/)

### Backend (API)
* **Runtime:** [Node.js](https://nodejs.org/)
* **Framework:** Express.js
* **Database ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Database Engine:** PostgreSQL hosted on [Neon](https://neon.tech/)
* **Hosting:** [Render](https://render.com/)

### External Services
* **Authentication & Identity:** [Clerk](https://clerk.dev/) (Including Webhook sync)
* **Payment Gateway:** [Razorpay](https://razorpay.com/)

---

## 🏗 Architecture & Infrastructure

AlignCare operates on a decoupled architecture:

1. **Vite SPA (Vercel):** The frontend strictly serves static assets and communicates via REST APIs. Vercel `rewrites` are configured to handle client-side routing for Clerk's nested authentication flows.
2. **Express API (Render):** A stateless Node.js backend handles complex business logic, Razorpay signature verification, and secure database transactions.
3. **Webhook Sync:** Clerk webhooks securely synchronize external identity events (user creation/updates) directly into the primary PostgreSQL database to guarantee relational integrity between users and their treatment plans.

---

## 🛠 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* PostgreSQL Database (or a free Neon project)
* Clerk API Keys
* Razorpay API Keys

### 1. Clone the repository
```bash
git clone https://github.com/GaurangRahani/AlignCare.git
cd AlignCare
```

### 2. Setup the Backend
```bash
cd Backend
npm install
```
Configure your `Backend/.env` file (see Environment Variables below).
```bash
# Push schema to database
npm run db:push

# Start the development server
npm run dev
```

### 3. Setup the Frontend
```bash
cd ../Frontend
npm install
```
Configure your `Frontend/.env` file.
```bash
# Start the Vite development server
npm run dev
```

---

## 🔐 Environment Variables

### `Backend/.env`
```env
# Server
PORT=5000

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Clerk Webhook Secret (For syncing users)
CLERK_WEBHOOK_SECRET="whsec_..."

# Razorpay Integration
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."

# Frontend URL (CORS)
FRONTEND_URL="http://localhost:5173"
```

### `Frontend/.env`
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Backend API URL
VITE_API_URL="http://localhost:5000"

# Razorpay (Public)
VITE_RAZORPAY_KEY_ID="rzp_test_..."
```

---

<div align="center">
  <p>Built with ❤️ for better physical rehabilitation.</p>
</div>
