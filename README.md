# BloodDonation Management System

![Status](https://img.shields.io/badge/Status-Active-success)
![MERN](https://img.shields.io/badge/Stack-MERN-blue)
![License](https://img.shields.io/badge/License-ISC-yellow)

## 🩺 Project Overview
**BloodDonation** is a comprehensive, full-stack web application designed to bridge the gap between blood donors, blood banks, and hospitals. Built using the **MERN Stack** (MongoDB, Express.js, React, Node.js), this platform facilitates real-time communication, efficient inventory management, and rapid emergency response.

The system features distinct portals for **Donors**, **Organizations** (Hospitals/Blood Banks), and **Admins**, ensuring a tailored experience for every user role. With integrated geolocation services and real-time analytical dashboards, we aim to make blood donation seamless and accessible.

---

## 🚀 Key Features

### 🩸 For Donors
- **User Dashboard**: Personalized hub to track donation history and eligibility.
- **Find Blood Banks**: Interactive map integration (Google Maps/Leaflet) to locate nearby donation centers.
- **Schedule Appointments**: Easy booking system for blood donation slots.
- **Real-time Notifications**: Alerts for urgent blood requirements nearby.
- **Certificate Generation**: Downloadable verified donation certificates (PDF).

### 🏥 For Organizations (Hospitals & Blood Banks)
- **Inventory Management**: Real-time tracking of blood units by blood group and component (RBC, Plasma, Platelets).
- **Request Handling**: Manage incoming requests from hospitals or individuals.
- **Camp Management**: Organize and promote blood donation camps.
- **Analytics Dashboard**: Visual charts (Recharts) for donation trends and stock levels.

### 🛡️ For Admin
- **System Oversight**: Monitor all users, organizations, and activities.
- **Verification**: Approve or reject organization registrations.
- **Global Reporting**: aggregated statistics and platform health monitoring.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: [React](https://react.dev/) (v19) with [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) (v4) & Vanilla CSS
- **Routing**: React Router DOM (v7)
- **State Management**: Context API
- **Maps**: React Leaflet & Google Maps API
- **Charts**: Recharts
- **Icons**: Lucide React & React Icons
- **HTTP Client**: Axios

### Backend (Server)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose ODM)
- **Authentication**: JWT & BcryptJS
- **Security**: Helmet, CORS, Rate Limiting
- **Email Service**: Nodemailer (SMTP)

---

## 📦 Installation & Setup

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas URL)

### 1. Clone the Repository
```bash
git clone <repository_url>
cd BloodDonation
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory:
```env
MONGODB_URI=mongodb://localhost:27017/blood-donation
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@blooddonation.com
FRONTEND_URL=http://localhost:5173
```

Start the backend server:
```bash
npm run dev
```

### 3. Client Setup
Open a new terminal, navigate to the client directory and install dependencies:
```bash
cd ../Client
npm install
```

Create a `.env` file in the `Client` directory:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_BACKEND_URL=your_backend_server_url
```

Start the frontend development server:
```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

---

## 👥 Group Members

This project was collaboratively developed by:

1.  **Kunal Sharma** - *Team Lead/Contributor*
2.  **Ashika** - *Contributor*
3.  **Avinash Kumar Thakur** - *Contributor*

---

## 📄 License
This project is licensed under the **ISC License**.
