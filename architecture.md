# AlignCare - Project Architecture Document

AlignCare is a modern, full-stack web application designed for physiotherapy clinics. It enables doctors to manage patients, prescribe exercise treatment plans, handle appointments, and track patient progress, while allowing patients to log their daily exercises, book appointments, and pay online.

---

## 1. Technology Stack

### Frontend
- **Framework**: React 19 + Vite (built with ES Modules for speed)
- **Styling**: Vanilla CSS with modern custom properties, micro-animations, and TailwindCSS available via `@tailwindcss/vite`
- **Routing**: React Router DOM
- **Authentication UI**: `@clerk/clerk-react`
- **Charting**: Recharts for visualizing patient progress
- **Icons**: Lucide React & FontAwesome

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`) for type-safe database interactions and schema management
- **Authentication**: Clerk (`@clerk/express`) with Svix for Webhook verification
- **Payments**: Razorpay (`razorpay`)
- **Media Storage**: Cloudinary (via `multer` and `multer-storage-cloudinary`)
- **Email Service**: Resend / Nodemailer for appointment confirmations and payment links

---

## 2. Directory Structure

### `Backend/`
The backend follows a standard MVC (Model-View-Controller) pattern adapted for REST APIs:

- **`server.js`**: The entry point. Mounts Express middlewares, Clerk webhooks (using `express.raw` for Svix verification), and all route handlers.
- **`controllers/`**: Contains the core business logic.
  - `appointment.controller.js`: Booking slots, Razorpay payment flow, double-booking prevention.
  - `exerciseLog.controller.js`: Patient logging, schedule updates.
  - `webhook.controller.js`: Syncs Clerk user creation into the PostgreSQL database.
- **`routes/`**: Express routers that map HTTP methods and URLs to specific controller functions.
- **`middlewares/`**:
  - `auth.middleware.js`: Verifies Clerk tokens, ensures the user exists in the DB, and enforces role-based access control (RBAC).
- **`src/db/`**:
  - `index.js`: Initializes the Drizzle ORM PostgreSQL connection pool.
  - `schema/`: Defines all tables, relations, and enums using Drizzle.

### `Frontend/`
The frontend follows a feature-based architecture, grouping components and pages by their domain context.

- **`src/features/`**:
  - **`dashboard/`**: Patient-facing views (Exercise Session player, Dashboard).
  - **`doctor/`**: Doctor-facing views (Patient List, Treatment Plan Builder, Alert Review Modals).
  - **`receptionist/`**: Desk-facing views (Patient Registration, Payment Collection).
- **`src/components/`**: Shared, reusable UI components (Buttons, Inputs, Layouts).
- **`src/utils/`**: Helper functions (e.g., `scheduleUtils.js` for date/time formatting).
- **`index.css`**: Global design tokens, color variables, and core theme rules.

---

## 3. Core Database Schema (PostgreSQL)

The database heavily utilizes Drizzle ORM for schema definitions. Key entities include:

- **Users & Profiles**:
  - `users`: Core identity table (synced with Clerk). Contains `role` (`patient`, `doctor`, `receptionist`, `admin`).
  - `patient_profiles` / `doctor_profiles`: Extended metadata for specific roles.
- **Appointments & Billing**:
  - `appointments`: Tracks booking slots, doctor/patient IDs, and `payment_status`. Uses a partial unique index to prevent active double-bookings.
  - `invoices` & `payments`: 1:1 mapping with appointments for tracking Razorpay or desk payments.
- **Treatment Plans**:
  - `treatment_plans`: Top-level prescription for a patient (start/end dates).
  - `treatment_plan_exercises`: Junction table assigning specific `exercises` to a plan with prescribed sets/reps.
- **Patient Schedule & Logs**:
  - `patient_schedule`: Auto-generated daily tasks for a patient based on their treatment plan.
  - `exercise_logs`: Daily records submitted by patients tracking `pain_level`, `sets_completed`, and `issue_type`. These trigger Alerts if pain is high.

---

## 4. Key Architectural Patterns

### Authentication & User Syncing
AlignCare uses Clerk as the Source of Truth for identity and passwords. When a user signs up, Clerk sends a webhook (via Svix). The `webhook.controller.js` catches this, verifies the cryptographic signature, and provisions a shadow user in the PostgreSQL `users` table so foreign keys can be safely established.

### The Schedule Generator
When a doctor assigns an exercise to a patient, the system mathematically calculates the `start_date` and `end_date` and bulk-inserts rows into `patient_schedule`. This allows the frontend to simply query `getTodaySchedule` to give patients a simple daily to-do list.

### Double-Booking Prevention
The `appointments` table uses a raw PostgreSQL **Partial Unique Index**:
`UNIQUE (doctor_id, appointment_date, start_time) WHERE status NOT IN ('cancelled', 'no_show')`.
This prevents two patients from booking the exact same slot at the database level, avoiding race conditions in the Node.js controllers.

### Role-Based Access Control (RBAC)
The `auth.middleware.js` inspects the database `role` of the authenticated Clerk user. Endpoints are wrapped in middlewares like `requireRole(['doctor', 'admin'])` to ensure rigid security boundaries between patient data and staff operations.
