# PhysioCare - Product Requirements Document (PRD)
**Version 2.0 (Final Production Version)**

## 1. Overview
### 1.1 Purpose
PhysioCare is a full-stack, cloud-hosted platform designed to digitize physical rehabilitation. It replaces fragmented paper-based clinic management with a centralized ecosystem that gamifies patient recovery at home, manages online and offline bookings, processes payments, and provides doctors with data-driven, real-time insights into patient adherence.

### 1.2 Problem Statement
Traditional physiotherapy relies on paper exercise sheets and manual tracking. 
- **For Patients:** Low motivation, forgotten routines, and no way to track progress at home.
- **For Doctors:** No visibility into whether a patient is actually doing their exercises. Issues are only discovered weeks later at the next visit.
- **For Clinics:** Scheduling conflicts, lost revenue from unpaid bookings, and inefficient manual billing.

### 1.3 Solution Goals
- Provide a unified portal for 4 roles: Patient, Doctor, Receptionist, and Admin.
- Build an interactive, video-guided Patient Portal to drive exercise adherence.
- Give Doctors an automated Treatment Plan Builder and a real-time Patient Alert system.
- Implement a 3-mode booking engine integrated with Razorpay to secure online slots.
- Ensure data integrity using database-level constraints and cryptographic webhook syncing.

---

## 2. System Architecture & Tech Stack
PhysioCare operates on a highly scalable, decoupled Serverless/PaaS architecture.

- **Frontend (Client):** React 18, Vite, React Router v6, Tailwind CSS. Hosted as a Single Page Application (SPA) on **Vercel**.
- **Backend (API):** Node.js, Express.js REST API. Hosted on **Render**.
- **Database:** PostgreSQL hosted on **Neon DB**, structured using **Drizzle ORM**.
- **Identity & Auth:** **Clerk** (with webhooks for local DB sync).
- **Payments:** **Razorpay** (Orders API for checkout, Payment Links API for emails).
- **Email Delivery:** Nodemailer via Gmail SMTP.

---

## 3. User Roles & Permissions
PhysioCare utilizes strict Role-Based Access Control (RBAC). A backend middleware layer (`requireRole`) ensures routes are completely secure.

### 3.1 Patient
- Books appointments online via the Self-Booking calendar.
- Views customized, day-by-day exercise schedules on an interactive dashboard.
- Watches instructional exercise videos.
- Logs exercise completion and pain levels (0-10 scale).

### 3.2 Doctor
- Configures weekly availability and specific date overrides (holidays/leaves).
- Records clinical consultation notes and diagnoses.
- Builds multi-week Treatment Plans using a custom Exercise Library.
- Monitors real-time "Red Flag" alerts if patients log high pain at home.

### 3.3 Receptionist
- Manages the complete patient registry.
- Books Walk-In appointments (collects payment at desk).
- Books Phone appointments (sends 30-minute Razorpay payment links via email).

### 3.4 Admin
- Views global clinic metrics (total revenue, active patients, appointments).
- Manages global clinic environment variables (Clinic Name, Contact Info).
- Invites, edits, and manages staff user accounts and role assignments.

---

## 4. Core System Workflows

### 4.1 The 3-Mode Booking Engine
Appointments converge into a single table but are generated via three real-world flows:
1. **At-Desk (Walk-In):** Receptionist books the slot and collects payment immediately. Status becomes 'confirmed'.
2. **Phone Booking:** Receptionist secures the slot and triggers a Razorpay Payment Link email. Status is 'pending_payment'. Patient has 30 minutes to pay.
3. **Self-Booking (Online):** Patient selects a doctor, views live computed availability, and completes Razorpay Checkout directly in the web modal.
*Conflict Resolution:* A database-level partial unique index mathematically prevents any double-bookings for the same doctor/time slot.

### 4.2 Automated Treatment Plan Generation
1. Doctor selects an exercise from the library.
2. Doctor sets parameters: Sets, Reps, Sessions per Day, Date Range.
3. Doctor selects a Frequency Pattern: Daily, Alternate Days, specific Weekdays, or a Custom Bitmask.
4. **The Algorithm:** The backend `generateSchedule` engine calculates the exact dates based on the frequency rule and generates individual rows in the `patient_schedule` table. Patients simply log in and see exactly what is due "Today".

### 4.3 Real-Time Alert System
- Instead of a traditional standalone "alerts" table that drifts out of sync, alerts are computed dynamically on read.
- If a patient logs an exercise with a `pain_level` ≥ 8, or submits a standalone concern tagged as `new_symptom`, it instantly flags as an alert.
- **Auto-Resolution:** When a doctor issues a new or updated Treatment Plan, the backend automatically resolves all pending alerts for that patient, preventing alert fatigue over stale data.

### 4.4 Automated Background Jobs (Cron)
Three automated `node-cron` jobs run on the backend to keep the system clean:
- **Payment Expiry (Runs Every Minute):** Sweeps for 'pending_payment' bookings older than 30 minutes. Cancels them and frees the doctor's slot.
- **Missed Sessions (Runs Daily):** Sweeps yesterday's unlogged exercises and marks them as 'missed'.
- **No-Shows (Runs Daily):** Marks uncompleted, past appointments as 'no_show'.

---

## 5. Security & Data Integrity

### 5.1 Just-In-Time (JIT) Provisioning
If a user registers via Clerk and authenticates on the frontend before the webhook reaches the backend, the backend automatically provisions a local database row on the fly. This prevents race-condition errors during initial login.

### 5.2 Cryptographic Webhook Verification
- **Clerk Identity:** User creation/updates in Clerk trigger a webhook. The backend uses `Svix` to verify the payload signature before syncing the user to the local Postgres database.
- **Razorpay Payments:** Payment success triggers a Razorpay webhook. The backend uses `HMAC-SHA256` to verify the signature, ensuring no forged payment confirmations can update the database.
- Both routes strictly utilize `express.raw()` before JSON parsing to preserve the exact byte payload required for cryptographic security.
