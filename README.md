# DoorDoctor AI

![DoorDoctor AI](https://img.shields.io/badge/Status-Production_Ready-success) ![License](https://img.shields.io/badge/License-MIT-blue)

DoorDoctor AI is a complete, production-ready telemedicine and digital healthcare platform built with a modern Next.js frontend and a high-performance FastAPI backend. It seamlessly connects patients with doctors, offering video consultations, AI-powered medical insights, real-time secure messaging, and a fully integrated payment workflow.

## 🚀 Key Features

### 1. Dual Portal System
- **Patient Dashboard**: Book appointments, manage health profiles, track timelines, upload clinical reports, and securely chat with doctors.
- **Doctor Dashboard**: Manage patient queues, approve/reject consultations, access AI-powered diagnostic tools, and configure availability slots.

### 2. AI-Powered Healthcare
- **Report Analysis**: Patients can upload PDF blood test results or medical reports. The AI automatically parses, summarizes, and explains the results in simple terms.
- **Clinical Copilot**: Doctors have access to an AI RAG Chatbot trained to assist with clinical workflows and diagnostic suggestions based on uploaded patient histories.

### 3. Integrated Telemedicine
- **Real-Time Video Consultations**: Fully functional, secure WebRTC/Jitsi-powered video rooms uniquely generated for each confirmed appointment.
- **Secure Messaging**: WebSocket-powered real-time chat between patients and doctors with end-to-end persistent MongoDB storage.

### 4. Advanced Booking & Payments
- **Stripe & Razorpay Integration**: Comprehensive payment workflow bridging frontend checkouts with backend webhooks.
- **Status Lifecycle**: Full appointment state machine (`pending_payment` -> `pending_doctor_approval` -> `accepted` / `rejected` -> `completed`).

### 5. Premium UI/UX
- Built using **Tailwind CSS** and **Lucide Icons** with a custom "Glassmorphism" and premium clinical aesthetic.
- Global Notification Centers, Responsive Data Tables, and Skeleton Loaders for asynchronous data.

---

## 🛠️ Technology Stack

### Frontend (Next.js 14)
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State & Auth**: Custom React Contexts (JWT Flow)
- **Icons**: Lucide React

### Backend (FastAPI)
- **Framework**: FastAPI (Python 3.10+)
- **Database**: MongoDB (Motor Asyncio)
- **Authentication**: JWT, Passlib (bcrypt)
- **AI Integrations**: OpenAI API / LangChain
- **WebSockets**: FastAPI WebSockets

---

## 📦 Project Structure

```text
MediAI/
├── frontend-next/        # Next.js Application
│   ├── app/              # App Router Pages (Admin, Doctor, Patient)
│   ├── components/       # Reusable UI Components
│   ├── contexts/         # Authentication & State
│   └── lib/              # Axios Interceptors & API configs
│
├── backend/              # FastAPI Application
│   ├── app/
│   │   ├── api/v1/       # REST Routes (Auth, Appointments, AI, Payments)
│   │   ├── core/         # Config, Security, JWT
│   │   ├── models/       # Pydantic Schemas & MongoDB Models
│   │   └── services/     # Business Logic (Stripe, DB Operations)
│
└── README.md             # Project Documentation
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/doordoctor-ai.git
cd doordoctor-ai
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (or `venv\Scripts\activate` on Windows)
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
SECRET_KEY=your_super_secret_jwt_key
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret
```

Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend-next
npm install
```

Create a `.env.local` file in the `frontend-next` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Run the development server:
```bash
npm run dev
```

---

## 🔒 Security & Compliance

- **JWT Authentication**: Short-lived access tokens with secure local storage implementations.
- **Role-Based Access Control (RBAC)**: Strict API middleware ensuring patients cannot access doctor routes and vice versa.
- **Data Privacy**: MongoDB architecture isolates sensitive PII.

---

## 👨‍💻 Contributing
This project is currently in Production Stabilization. Please refer to the `CHANGELOG.md` and `PROJECT_COMPLETION_REPORT.md` for recent architectural decisions.

## 📄 License
This project is licensed under the MIT License.
