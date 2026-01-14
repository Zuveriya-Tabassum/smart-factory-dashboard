# Smart Factory Control Dashboard

A full-stack industrial monitoring and control dashboard for factory machines with real-time analytics, alerts, logs, and secure role-based access.

Roles supported:  
- Admin  
- Engineer  
- Operator (Viewer)

---

##  Tech Stack

**Frontend**
- React
- Vite
- CSS Variables (Theme support: light / dark / pink)

**Backend**
- Node.js
- Express.js
- JWT Authentication
- Socket.io (real-time updates)

**Database**
- MongoDB (Mongoose)

---

##  Project Structure

```txt
root/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── middleware/
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── context/
│   │   └── socket/
│   └── .env
│
└── README.md

---

## Prerequisites

Before setting up the project, ensure the following are installed:

- Node.js 
- npm or yarn
- PostgresSQL
- Git
- Postman (for API testing)

---

## 1. Clone the Repository

```bash
git clone https://github.com/Zuveriya-Tabassum/smart-factory-dashboard.git
cd smart-factory-dashboard

2. Backend Setup (backend/)
cd backend
npm install

Create .env file inside backend/
PORT=5001
MONGO_URI=mongodb://localhost:27017/factory-db
JWT_SECRET=super-secret-key
NODE_ENV=development

(Optional) Seed Demo Data
npm run seed

Start Backend Server
npm run dev
# or
npm start


Backend will run at:

http://localhost:5001

 3. Frontend Setup (frontend/)
cd ../frontend
npm install

Create .env file inside frontend/
VITE_API_URL=http://localhost:5001

Start Frontend Server
npm run dev


Frontend will run at:

http://localhost:5173


Open this URL in your browser to access the dashboard.

 4. Default User Accounts (Sample)

If seed data is enabled, you may use the following accounts:

Admin
Email: admin1@example.com
Password: admin123

Engineer
Email: eng1@example.com
Password: eng123

Operator (Viewer)
Email: op1@example.com
Password: op123

 5. Features Overview
 Machine Monitoring

View machine list with real-time status

Live metrics: temperature, efficiency, cycles

Start / Stop / Reset machines (Engineer/Admin)

Assign jobs and change operating mode

Emergency shutdown (Admin only)

 Alerts

Automatic alerts based on thresholds:

High temperature

Low efficiency

Fault conditions

Severity levels (Warning / Critical)

Acknowledge alerts (Engineer/Admin)

Resolve alerts (Admin)

Real-time alert updates

Logs

Full audit trail of system actions

Tracks:

User logins

Machine controls

Alert acknowledgements

Filter by machine, user, or date

Export logs as CSV

Analytics

KPI cards:

Total machines

Active machines

Average efficiency

Critical alerts count

Charts for efficiency and utilization

Risk indicators (color-coded)

Theme-aware analytics (light/dark/custom)

 Admin Dashboard

Approve or reject user registrations

Change user roles

Suspend or reactivate users

View role-based user counts

Emergency shutdown of all machines

Seed demo machines

 6. Running Full Stack (Development Mode)

Open two terminals:

Terminal 1 – Backend
cd backend
npm run dev

Terminal 2 – Frontend
cd frontend
npm run dev


Ensure the frontend .env points to the backend URL.

7. Production Build
Frontend Build
cd frontend
npm run build


Build output will be available in:

frontend/dist/


You can serve this using Express, Nginx, or any static hosting service.

 8. Postman API Collection

A Postman collection file is included in the repository:

postman_collection.json

Steps to Use:

Open Postman → Import.

Import the collection file.

Set baseUrl to http://localhost:5001.

Call Auth → Login.

Copy JWT token and set it in collection variables.

APIs Included:

Authentication (login, register, approval)

Machine control APIs

Alerts management

Logs and CSV export

Analytics endpoints
