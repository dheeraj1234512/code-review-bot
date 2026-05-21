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
    allow_origins=[
        "http://localhost:3000",
        "https://code-review-bot-navy.vercel.app/",
],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class ReviewRequest(BaseModel):
    code: str
    language: str = "python"

def stream_review(code: str, language: str):
    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """Tu ek expert code reviewer hai.
Har review mein yeh sections de:

## Summary
Yeh code kya karta hai — 2 lines mein

## Issues Found
Bugs, security holes, bad practices — numbered list

## Fixed Code
Corrected version with inline comments

## Score
X/10 — ek line reason ke saath

Markdown use kar. Specific aur helpful reh."""
            },
            {
                "role": "user",
                "content": (
                    f"Review karo yeh {language} code:\n"
                    f"```{language}\n{code}\n```"
                )
            }
        ],
        max_tokens=2000,
        stream=True,
    )
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
        raise HTTPException(
            status_code=400,
            detail="Code nahi mila"
        )
    return StreamingResponse(
        stream_review(request.code, request.language),
        media_type="text/plain",
    )