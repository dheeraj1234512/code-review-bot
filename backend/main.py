import os
from groq import Groq
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class ReviewRequest(BaseModel):
    code: str
    language: str = "python"
    mode: str = "quick"  # quick | deep | security

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
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

@app.get("/")
def root():
    return {"status": "Backend chal raha hai! 🚀"}

@app.post("/review")
def review_code(request: ReviewRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code nahi mila")
    return StreamingResponse(
        stream_review(request.code, request.language, request.mode),
        media_type="text/plain",
    )