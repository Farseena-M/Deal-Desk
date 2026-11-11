
# DealDesk

DealDesk is a full-stack application for managing business deals, discount approvals, real-time chat, and invoice processing through an external billing service (BillPort).

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite

**Backend**
- Node.js
- NestJS
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication
- Socket.IO

## Features

- User authentication.
- Role-based access control.
- Deal management.
- Configurable discount approval workflow.
- Real-time chat and notifications.
- Invoice management.
- BillPort integration.
- Webhook verification and duplicate handling.
- Automatic retries and invoice reconciliation.

## Project Structure

```text
deal-desk/
├── frontend/
├── backend/
├── billport/
├── README.md
└── .gitignore
```

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd deal-desk
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file and configure the required environment variables.

Run the backend:

```bash
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file and configure the backend API URL.

Run the frontend:

```bash
npm run dev
```

### Database Seeding

Run the seed script from the backend:

```bash
npm run seed
```

## API Testing

Import the Postman collection from the `postman` folder to test the API endpoints.

## BillPort Service

BillPort is a separate service that simulates an external billing system, including invoice creation, webhooks, and failure scenarios.
