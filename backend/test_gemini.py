import os
import time
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

url = (
    f"https://generativelanguage.googleapis.com/"
    f"v1beta/models/{model}:generateContent"
)

body = {
    "contents": [
        {
            "role": "user",
            "parts": [{"text": "Reply with only OK"}]
        }
    ],
    "generationConfig": {
        "maxOutputTokens": 20
    }
}

if not api_key:
    print("GEMINI_API_KEY is missing")
    raise SystemExit(1)

try:
    start = time.time()

    response = httpx.post(
        url,
        params={"key": api_key},
        json=body,
        timeout=60
    )

    print("HTTP STATUS:", response.status_code)
    print("TIME TAKEN:", round(time.time() - start, 2), "seconds")
    print("RESPONSE:", response.text[:1500])

except httpx.TimeoutException as error:
    print("TIMEOUT:", type(error).__name__, str(error))

except httpx.RequestError as error:
    print("CONNECTION ERROR:", type(error).__name__, str(error))