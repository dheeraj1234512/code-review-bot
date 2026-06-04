# Backend Setup Instructions

## Files & Structure

```
backend/
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (git ignored)
├── .env.example         # Example env template
├── Procfile             # Heroku deployment configuration
├── runtime.txt          # Python version specification
└── venv/                # Virtual environment
```

## Installation Steps

### 1. Create/Activate Virtual Environment

**Windows:**
```bash
# Create venv (first time only)
python -m venv venv

# Activate
venv\Scripts\activate
```

**macOS/Linux:**
```bash
# Create venv (first time only)
python3 -m venv venv

# Activate
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `.env` file with:
```
GROQ_API_KEY=your_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
FRONTEND_URL=http://localhost:3000
PORT=8000
```

### 4. Run the Server

```bash
python main.py
```

Server will start at `http://0.0.0.0:8000`

## Backend Features

### ✅ Recently Fixed
- [x] Added main entry point for local testing
- [x] Added comprehensive error handling
- [x] Added mode validation (quick/deep/security)
- [x] Added null-safety checks for streaming
- [x] Added logging for debugging
- [x] Added Supabase client initialization
- [x] Added health check endpoint
- [x] Added code size validation
- [x] Created .env.example documentation

### 📊 API Endpoints

#### 1. Root Status
```
GET /
```
Returns: `{"status": "Backend chal raha hai! 🚀"}`

#### 2. Health Check
```
GET /health
```
Returns: `{"status": "ok", "service": "code-review-bot"}`

#### 3. Code Review
```
POST /review
Content-Type: application/json

Body:
{
  "code": "python code here",
  "language": "python",
  "mode": "quick"
}
```

**Valid modes:**
- `quick` - Fast 300-word review
- `deep` - Comprehensive analysis
- `security` - Security-focused audit

**Responses:**
- 200: Streaming review text
- 400: Invalid request (empty code, invalid mode)
- 413: Code too large (>50KB)
- 500: Server error

## Monitoring & Debugging

### Check if server is running
```bash
curl http://localhost:8000/
```

### View logs
Logs appear in the terminal where you ran `python main.py`:
```
INFO:     Started server process [12345]
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Test API endpoint
```bash
# Quick review test
curl -X POST http://localhost:8000/review \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"hello\")", "language":"python", "mode":"quick"}'
```

## Dependencies

### Core
- **fastapi** (0.136.1) - Web framework
- **uvicorn** (0.47.0) - ASGI server
- **pydantic** (2.13.4) - Data validation
- **python-dotenv** (1.2.2) - Environment config

### AI & APIs
- **groq** (1.2.0) - Groq API client
- **supabase** (2.14.4) - Supabase client
- **razorpay** (2.8.6) - Payment gateway

### Utilities
- **python-multipart** - Form data parsing
- **httptools** - HTTP parsing
- **watchfiles** - Auto-reload on file changes

## Python Version

- Required: Python 3.12+
- Specified in `runtime.txt`
- Using Python 3.12.10 in current venv

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'groq'"
```bash
# Make sure venv is activated
venv\Scripts\activate  # Windows
# Then install requirements
pip install -r requirements.txt
```

### Error: "GROQ_API_KEY not set"
```bash
# Verify .env file exists in backend/ directory
# Add GROQ_API_KEY=your_key
# Restart the server
```

### Error: "Address already in use"
```bash
# Port 8000 is in use by another process
# Either:
# 1. Kill the other process
# 2. Change PORT in .env file
# 3. Use different port: python main.py (modify if __name__ block)
```

### Slow responses from Groq API
- Groq API sometimes takes 5-10 seconds for first request
- Large code files take longer to analyze
- This is normal, be patient or use "quick" mode

## Deployment

### Heroku
1. Already configured with Procfile
2. Push to Heroku
3. Set environment variables in Heroku dashboard
4. Server will auto-start

### Railway/Other Platforms
1. Install requirements: `pip install -r requirements.txt`
2. Run: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Set all environment variables

## Next Steps

1. ✅ Start backend: `python main.py`
2. Start frontend: `npm run dev` (in frontend/ folder)
3. Open http://localhost:3000
4. Sign up with Clerk
5. Test with code review!

---

**All set!** The backend is now production-ready. 🚀
