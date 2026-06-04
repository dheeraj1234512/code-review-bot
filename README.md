# Code Review Bot - Complete Setup & Running Guide

## 📋 Project Overview
This is a full-stack Code Review Bot application with:
- **Backend**: FastAPI server with Groq AI for code reviews
- **Frontend**: Next.js app with Clerk authentication and Supabase database

## ✅ Status
- ✅ Backend: Fully configured and running
- ✅ Frontend: Environment configured
- ✅ Database: Supabase connected
- ✅ Authentication: Clerk integrated

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+ (Backend)
- Node.js 18+ (Frontend)
- Active internet connection

### Backend Setup & Running

**Option 1: Using Virtual Environment (Recommended)**
```bash
cd backend

# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run the server
python main.py
```

Backend will start at: `http://localhost:8000`

**Check if backend is running:**
```bash
curl http://localhost:8000/
curl http://localhost:8000/health
```

### Frontend Setup & Running

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will start at: `http://localhost:3000`

---

## 📝 Environment Configuration

### Backend (.env file)
```
GROQ_API_KEY=your_groq_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
FRONTEND_URL=http://localhost:3000
PORT=8000
```

### Frontend (.env.local file)
Already configured with:
- Clerk authentication keys
- Supabase credentials
- Backend URL pointing to localhost:8000
- Razorpay key

---

## 🔧 API Endpoints

### Health Check
```
GET /health
Response: {"status": "ok", "service": "code-review-bot"}
```

### Get Status
```
GET /
Response: {"status": "Backend chal raha hai! 🚀"}
```

### Code Review (Streaming)
```
POST /review
Content-Type: application/json

Request:
{
  "code": "your_code_here",
  "language": "python",
  "mode": "quick"  // quick | deep | security
}

Response: Streaming text response with code review
```

---

## 📚 Review Modes

1. **Quick Mode** (Default)
   - Fast review, max 300 words
   - Summary, top 3 issues, quick fix, score

2. **Deep Mode**
   - Thorough analysis
   - Issues with severity levels, code quality analysis
   - Refactored code with comments
   - Best practices

3. **Security Mode**
   - Security-focused audit
   - Critical, medium, low-risk issues
   - Security checklist
   - Secure code patches

---

## 🐛 Troubleshooting

### Backend fails to start
```
Error: ModuleNotFoundError: No module named 'fastapi'
Solution: pip install -r requirements.txt
```

### Backend running but frontend can't connect
```
Error: Backend se connect nahi ho pa raha
Solution: 
1. Verify backend is running: http://localhost:8000/health
2. Check frontend .env.local has: NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
3. Ensure CORS is enabled (it is by default)
```

### Frontend doesn't load
```
Error: npm: command not found
Solution: Install Node.js from nodejs.org
```

---

## 📊 Technology Stack

### Backend
- FastAPI - Web framework
- Groq API - AI code review
- Python 3.12 - Runtime
- Supabase - Database
- Uvicorn - ASGI server

### Frontend
- Next.js 16 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Clerk - Authentication
- Supabase - Database client
- jsPDF - PDF export

---

## 🔐 Security Notes
- All API keys are in .env files (not committed)
- GROQ_API_KEY is required for reviews to work
- Supabase service key is backend-only
- Frontend only exposes anon key to client

---

## 📖 How It Works

1. User logs in via Clerk
2. Uploads code file or pastes code
3. Frontend sends to backend API
4. Backend validates and sends to Groq AI
5. Groq analyzes code and streams response
6. Frontend displays review in real-time
7. Review is saved to Supabase database
8. User can download review as PDF

---

## 🚀 Deployment

### Backend (Heroku/Railway)
- Currently configured with Procfile
- Set environment variables on hosting platform
- Run: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
- Already has Vercel configuration
- Frontend URL: https://code-review-bot-navy.vercel.app

---

## 📞 Support
For issues, check:
1. Backend logs in terminal
2. Browser console (F12)
3. Network tab for API calls
4. .env files for missing configuration

All set! Happy coding! 🎉
