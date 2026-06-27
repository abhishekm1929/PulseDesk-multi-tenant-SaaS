# 🚀 PulseDesk

A modern **Multi-Tenant Help Desk SaaS** built during the **Forge 2 Hackathon** using **Laravel 11, React, MySQL, and Tailwind CSS**.

## ✨ Features

- 🔐 Secure Authentication (Laravel Sanctum)
- 🏢 Multi-Tenant Architecture
- 🎫 Ticket Management (CRUD)
- 👥 Role-Based Access (Admin, Agent, Customer)
- 💬 Threaded Ticket Conversations
- 🔍 Search & Filters
- 📊 Dashboard & Analytics
- 📡 RESTful API
- 🧪 Automated Testing & CI

## 🛠 Tech Stack

**Frontend**
- React 19
- Vite
- Tailwind CSS

**Backend**
- Laravel 11
- PHP 8.2+
- MySQL
- Laravel Sanctum

## 📂 Project Structure

```text
backend/
frontend/
agents/
sprints/
evidence/
README.md
```

## ⚙️ Installation

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📸 Screenshots

> Add your application screenshots here.

## 🤖 AI Workflow

- **Hermes** → Sprint planning & task orchestration
- **OpenClaw** → Feature development, testing & implementation
- Human-reviewed pull requests before merge

## 🚀 Future Enhancements

- Email Notifications
- Real-time Updates
- SLA Tracking
- Customer Satisfaction Ratings
- AI Ticket Summarization

## 📄 License

This project was built for the **Forge 2 Hackathon** and is available for educational purposes.
