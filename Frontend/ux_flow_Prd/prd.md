# PhysioCare - Product Requirements Document (PRD)

## 1. Project Overview
PhysioCare is a comprehensive clinic management and patient recovery platform for physiotherapy clinics. It bridges the gap between in-clinic operations and at-home patient recovery. The system allows clinic staff to manage appointments and billing, doctors to prescribe structured digital treatment plans, and patients to follow and log their daily exercise routines with compliance tracking.

## 2. Tech Stack
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Neon/Supabase)
* **ORM:** Drizzle ORM
* **Authentication:** Clerk (via Webhooks)
* **Payments:** Razorpay (Orders for self-checkout, Payment Links for phone bookings)
* **Background Jobs:** Node-Cron

## 3. User Roles & Capabilities
The system relies on Role-Based Access Control (RBAC). A user's role dictates their permissions:

1. **Patient:** Can view their own active treatment plan, log daily exercises, self-book appointments, process online payments, and download their invoices.
2. **Doctor:** Can view all assigned patients, conduct consultations, create/edit treatment plans, assign bulk exercises with specific frequencies, and monitor patient compliance/pain logs.
3. **Receptionist:** Can register new patients, book appointments over the phone, collect at-desk payments, and view the clinic schedule.
4. **Admin:** Full access to metrics, user management, and clinic configuration.

## 4. Core Workflows & Logic

### A. Authentication & Identity
* **System:** Handled entirely by **Clerk**.
* **Flow:** When a user registers via Clerk, a Clerk webhook (`user.created`) fires to the backend. The backend catches this, verifies the Svix signature, and provisions a local record in the `users` table and a corresponding profile in `patient_profiles` or `doctor_profiles`.
* **Receptionist Registration:** Receptionists can register patients inline (e.g., over the phone). The backend uses the Clerk Backend SDK to silently create the Clerk account, generate a secure temporary password, save the DB record, and send a welcome email.

### B. Appointments & Payment Integration (Razorpay)
The booking system guarantees slot exclusivity and handles both online and offline payments securely.
* **Slot Hold (15 Minutes):** When an appointment is booked, the slot is reserved in a `pending_payment` state with a `payment_expires_at` timestamp set 15 minutes into the future.
* **Self-Booking (Patient Flow):** The backend generates a Razorpay **Order ID**. The frontend opens the Razorpay checkout modal.
* **Phone Booking (Receptionist Flow):** The backend generates a Razorpay **Payment Link** and emails it to the patient.
* **Webhook Confirmation:** The backend relies *only* on the `razorpayWebhook` (`order.paid` or `payment_link.paid`) to confirm payments. The webhook validates the HMAC-SHA256 signature, confirms the appointment (`status = scheduled`), clears the expiry timer, and atomically generates an **Invoice** and a **Payment** record.
* **At-Desk Payment:** Receptionists can manually mark a `pending_payment` appointment as paid via Cash/Card at the front desk, bypassing Razorpay entirely.

### C. Treatment Planning & Dynamic Scheduling
This is the core clinical feature.
* **Treatment Plan:** A doctor creates a plan for a patient (e.g., "Post-Op Knee Rehab") with a start and end date.
* **Exercise Prescription:** Doctors assign exercises to the plan with specific parameters:
  * `sets` & `reps`
  * `frequency_type`: Daily, Alternate Days, Mon/Wed/Fri, Tue/Thu/Sat, or Custom Days (Bitmask).
  * `sessions_per_day`: How many times a day the exercise must be performed (e.g., 2 times a day).
* **Schedule Generator:** When exercises are assigned, the backend dynamically extrapolates the configuration into individual calendar rows in the `patient_schedule` table for the entire duration of the plan. (e.g., "Neck Stretch, Day 1, Session 1", "Neck Stretch, Day 1, Session 2").

### D. Patient Exercise Logging
* **Daily Focus:** Patients only see their schedule for **today**. They cannot log future exercises.
* **Session Logging:** Patients log completed sets and optional pain levels (0-10) for specific sessions. 
* **Standalone Concerns:** Patients can log a general issue (e.g., "Woke up dizzy") independent of an exercise.
* **Safety Triggers:** If a patient logs a pain level $\ge 7$, it is flagged prominently for the doctor.

### E. Cron Jobs (Background Tasks)
Two critical background tasks run on the server:
1. **Expiry Sweep (Every Minute):** Searches for appointments in `pending_payment` where the 15-minute `payment_expires_at` timer has passed. It cancels these appointments to free up the doctor's calendar.
2. **Missed Exercise Sweep (Every Midnight):** Looks for any exercise in the `patient_schedule` scheduled for *yesterday or earlier* that is still `'pending'`. It forcefully flips the status to `'missed'`. This locks the historical record (preventing patients from falsifying past logs) and ensures accurate compliance metrics for the doctor.

## 5. Database Schema (High-Level Overview)
* `users`: The central table linking `clerk_id` to the role (patient, doctor, receptionist, admin).
* `patient_profiles` / `doctor_profiles`: Extended metadata (medical history, specialties, availability rules).
* `appointments`: Stores booking slots, status, and expiry timestamps.
* `consultations`: Stores doctor's clinical notes post-appointment.
* `invoices` & `payments`: Atomic billing records tied to appointments.
* `treatment_plans`: Container for a patient's active recovery regimen.
* `exercises`: Master library of exercises (names, video URLs, instructions).
* `treatment_plan_exercises`: The "prescription" mapping an exercise to a plan with sets, reps, and frequency rules.
* `patient_schedule`: The extrapolated daily to-do list (Session 1, Session 2) generated from the prescriptions.
* `exercise_logs`: The actual patient feedback (sets completed, pain level, comments).

## 6. Key Frontend Considerations
* **Strict Daily View:** The patient dashboard must fetch `GET /api/patients/:id/today` and strictly display today's tasks. There is no grace period for yesterday's logs.
* **Webhook Dependency:** The frontend should never assume payment is successful based solely on the Razorpay client callback. Always rely on the backend webhook to change the appointment state.
* **Clerk UI:** Utilize standard Clerk components for sign-up, sign-in, and password resets to minimize custom Auth UI overhead.
