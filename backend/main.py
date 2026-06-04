import os
import logging
from groq import Groq
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY environment variable not set")
client = Groq(api_key=groq_api_key)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
else:
    logger.warning("Supabase credentials not configured")
    supabase = None

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
    "quick": """Tu ek fast code reviewer hai.
Concise aur to-the-point reh — max 300 words.

## Summary
1 line mein kya karta hai yeh code

## Top Issues
3 sabse important problems — numbered list

## Quick Fix
Sabse important fix ka code example

## Score
X/10""",

    "deep": """Tu ek senior software engineer hai jo thorough code review karta hai.
Har cheez detail mein cover kar.

## Summary
Code ka purpose aur overall structure

## Issues Found
Sab bugs, bad practices, performance issues — numbered list with severity (🔴 Critical / 🟡 Warning / 🟢 Suggestion)

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
X/10 with detailed reasoning""",

    "security": """Tu ek cybersecurity expert hai jo security audit karta hai.
Sirf security vulnerabilities pe focus kar.

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
- [ ] Error handling""",
}

def stream_review(code: str, language: str, mode: str = "quick"):
    prompt = PROMPTS.get(mode, PROMPTS["quick"])
    try:
        with client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": (
                        f"Review karo yeh {language} code:\n"
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
    return {"status": "Backend chal raha hai! 🚀"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "code-review-bot"}

@app.post("/review")
def review_code(request: ReviewRequest):
    try:
        # Validate input
        if not request.code or not request.code.strip():
            raise HTTPException(status_code=400, detail="Code body required - 'code' field is empty")
        
        # Validate mode
        if request.mode not in ["quick", "deep", "security"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid mode '{request.mode}'. Must be: quick, deep, or security"
            )
        
        if len(request.code) > 50000:
            raise HTTPException(status_code=413, detail="Code bahut bada hai — 50KB limit")
        
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