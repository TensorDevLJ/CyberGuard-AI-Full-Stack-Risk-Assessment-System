# 🚀 CyberGuard AI – Full Stack Risk Assessment System

CyberGuard AI is an end-to-end web application that enables cyber risk prediction using Machine Learning with a FastAPI backend and a modern React frontend.

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── auth.py
│   ├── ml_model/  (Trained TensorFlow model)
│   ├── venv/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.tsx
│   ├── public/
│   └── package.json
└── README.md
```

---

## ✅ Prerequisites

- Python 3.10+
- Node.js & npm
- Git
- VS Code (recommended)

---

## ⚙️ Backend Setup (FastAPI)

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Create and activate a virtual environment

```bash
# Windows PowerShell
py -3.10 -m venv venv
.\venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

📌 If you get an error about `email_validator`, run:

```bash
pip install pydantic[email]
```

### 4. Run FastAPI backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> Visit the docs at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 Frontend Setup (React + TypeScript + Tailwind)

### 1. Navigate to frontend folder

```bash
cd ../frontend
```

### 2. Install node dependencies

```bash
npm install
```

### 3. Start the React development server

```bash
npm run dev
```

> Access the frontend at: [http://localhost:5173](http://localhost:5173)

---

## 🧠 Features

- 🔐 User Authentication (JWT)
- 📊 Dashboard with Risk Predictions
- 👥 User Management and Role-based Access
- ⚙️ Settings and Personalization
- 🌙 Light/Dark Mode
- 📦 RESTful API with auto docs via FastAPI

---

## ☁️ Deployment Suggestions

- **Backend**: Render, Railway, or Azure App Service
- **Frontend**: Vercel or Netlify
- **Database**: PostgreSQL (on Supabase or Railway)

---

## 🛠️ GitHub Upload Steps

```bash
# From project root
git init
echo venv/ > .gitignore
git add .
git commit -m "Initial commit: Full Stack CyberGuard AI"
git branch -M main
git remote add origin https://github.com/your-username/cyberguard-ai.git
git push -u origin main
```

---

## 👨‍💻 Author


Made with ❤️ by TensorDevLJ


---

## 📄 License

This project is licensed under the MIT License.