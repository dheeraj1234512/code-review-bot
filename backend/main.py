import os
import sys
import logging
from contextlib import asynccontextmanager
from groq import Groq
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Optional imports - won't crash if missing
try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    create_client = None

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize Groq client
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    logger.warning("⚠️  GROQ_API_KEY not configured - reviews won't work")
    client = None
else:
    try:
        client = Groq(api_key=groq_api_key)
        logger.info("✅ Groq client initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Groq client: {e}")
        client = None

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

if not HAS_SUPABASE:
    logger.warning("⚠️  Supabase module not available - install with: pip install supabase")
    supabase = None
elif supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
        logger.info("✅ Supabase client initialized")
    except Exception as e:
        logger.error(f"⚠️  Supabase initialization failed: {e}")
        supabase = None
else:
    logger.warning("⚠️  Supabase credentials not configured (SUPABASE_URL or SUPABASE_SERVICE_KEY missing)")
    supabase = None

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=" * 50)
    logger.info("🚀 Code Review Bot Backend Starting")
    logger.info("=" * 50)
    logger.info(f"✅ Groq client: {'initialized' if client else '❌ NOT CONFIGURED'}")
    logger.info(f"✅ Supabase client: {'initialized' if supabase else '⚠️  not configured'}")
    logger.info(f"📍 Port: {os.getenv('PORT', '8000')}")
    logger.info(f"🌐 Frontend URL: {os.getenv('FRONTEND_URL', 'not set')}")
    logger.info("=" * 50)
    yield
    # Shutdown
    logger.info("🛑 Backend shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewRequest(BaseModel):
    code: str
    language: str = "python"
    mode: str = "quick"  # quick | deep | security
    user_id: str | None = None  # Optional user ID for saving reviews
    
    def validate_mode(self):
        valid_modes = ["quick", "deep", "security"]
        if self.mode not in valid_modes:
            raise ValueError(f"Invalid mode. Must be one of: {', '.join(valid_modes)}")
        return self

# 3 alag prompts — har mode ke liye
PROMPTS = {
    "quick": """You are a fast code reviewer.
Concise and to-the-point — max 500 words.

## Summary
One-line summary of the code purpose

## Top Issues
3 Most Important Problems — numbered list

## Quick Fix
Code snippet fixing the most critical issue

## Score
X/10
""",

    "deep": """You are a senior software engineer who performs thorough code reviews.
Every aspect is covered in detail.

## Summary
Code Purpose and Overall Functionality

## Issues Found
All bugs, bad practices, performance issues — numbered list with severity (🔴 Critical / 🟡 Warning / 🟢 Suggestion)

## Code Quality
- Readability
- Maintainability
- Performance
- Test coverage (agar hai)

## Refactored Code
Poora improved version with comments explaining changes

## Best Practices
Is language ke specific best practices jo miss hue

## Score
X/10 with detailed reasoning""""""You are a senior software engineer who performs thorough code reviews.
Every aspect is covered in detail.

## Summary
Code purpose and overall functionality

## Issues Found
All bugs, bad practices, performance issues — numbered list with severity (🔴 Critical / 🟡 Warning / 🟢 Suggestion)

## Code Quality
- Readability
- Maintainability
- Performance
- Test coverage (if present)

## Refactored Code
Complete improved version with comments explaining changes

## Best Practices
Language-specific best practices that were missed

## Score
X/10 with detailed reasoning
""",

    "security": """You are a cybersecurity expert who performs security audits.
Focus only on security vulnerabilities.

## Security Score
X/10 — overall security rating

## Critical Vulnerabilities 🔴
Life-threatening security issues — immediate fix required

## Medium Risk Issues 🟡
Important security concerns

## Low Risk Issues 🟢
Minor security improvements

## Secure Code
Fixed version with security patches applied

## Security Checklist
- [ ] Input validation
- [ ] SQL injection protection
- [ ] XSS prevention
- [ ] Authentication/Authorization
- [ ] Sensitive data exposure
- [ ] Error handling
""",
}

def stream_review(code: str, language: str, mode: str = "quick"):
    if not client:
        yield "❌ Groq API not configured. Please set GROQ_API_KEY environment variable on Railway."
        return
    
    prompt = PROMPTS.get(mode, PROMPTS["quick"])
    try:
        with client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": (
                        f"Review This {language} code:\n"
                        f"```{language}\n{code}\n```"
                    ),
                },
            ],
            max_tokens=2000,
            stream=True,
        ) as stream:
            for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield delta.content
    except Exception as e:
        logger.error(f"Error during review: {str(e)}")
        yield f"\n\n❌ Error: {str(e)}"

@app.get("/")
def root():
    return {"status": "Backend is running! 🚀"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "code-review-bot",
        "groq_configured": client is not None,
        "supabase_configured": supabase is not None,
    }

@app.get("/config")
def config():
    """Debug endpoint to check configuration"""
    return {
        "groq_api_key_set": bool(os.getenv("GROQ_API_KEY")),
        "supabase_url_set": bool(os.getenv("SUPABASE_URL")),
        "supabase_key_set": bool(os.getenv("SUPABASE_SERVICE_KEY")),
        "frontend_url": os.getenv("FRONTEND_URL", "not set"),
        "port": os.getenv("PORT", "8000"),
        "python_version": sys.version,
    }

@app.post("/review")
def review_code(request: ReviewRequest):
    try:
        # Check if Groq is configured
        if not client:
            raise HTTPException(
                status_code=503,
                detail="Groq API not configured. Set GROQ_API_KEY environment variable."
            )
        
        # Validate input
        if not request.code or not request.code.strip():
            raise HTTPException(status_code=400, detail="Code body required - 'code' field is empty")
        
        # Validate mode
        if request.mode not in ["Quick", "Deep", "Security"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid mode '{request.mode}'. Must be: Quick, Deep, or Security"
            )
        
        if len(request.code) > 50000:
            raise HTTPException(status_code=413, detail="Code is too large — 50KB limit")
        
        logger.info(f"Review request - Language: {request.language}, Mode: {request.mode}")
        
        return StreamingResponse(
            stream_review(request.code, request.language, request.mode),
            media_type="text/plain",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)