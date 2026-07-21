# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-07-21

### Added
- **Global Notification Center**: Implemented a notification bell dropdown in both Patient and Doctor layout headers for real-time alerts.
- **Comprehensive Settings UI**: 
  - Revamped Patient Settings to include tabs for Profile, Security, Notifications, Preferences, and Danger Zone.
  - Revamped Doctor Settings to include tabs for Professional Profile, Schedule, Security, Notifications, Preferences, and Danger Zone.
- **Stripe & Razorpay Integration**: Added backend and frontend payment gateways to handle the appointment booking flow.
- **Video Consultations**: Integrated Jitsi-based secure video consultation rooms locked to active appointments.
- **Real-time Chat**: Added WebSocket-based persistent chat system between patients and doctors.
- **AI Medical Report Analysis**: Implemented LangChain and OpenAI to summarize and parse uploaded patient PDF reports.
- **Doctor Availability Logic**: Added robust scheduling and fallback logic to ensure valid booking slots are presented to patients.

### Changed
- **Dashboard Aesthetics**: Polished UI with Tailwind CSS, standardizing spacing, borders, colors (blue/slate/white combinations), and glassmorphism effects.
- **Authentication Context**: Updated `AuthContext.tsx` to handle `_id` and `id` reconciliation between frontend user objects and MongoDB BSON.
- **Next.js Suspense**: Wrapped search parameters fetching (`useSearchParams`) in `<Suspense>` boundaries to resolve static rendering errors.

### Fixed
- **Vercel Build Issues**: Resolved TypeScript mismatch errors between `User` interface expectations and API payload structures.
- **Payment Verification Loop**: Fixed frontend state issues where appointments would get stuck in `pending_payment` by forcing polling on the `payment_service`.

### Security
- **Strict Role Boundaries**: Enforced role checks on frontend layouts (e.g., patient trying to access doctor dashboard gets redirected).
- **Session Security**: Added UI options for revoking connected devices (visuals implemented, backend hooks prepared).
