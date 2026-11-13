
import os
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

api_key = os.getenv("GEMINI_API_KEY")

url = "https://generativelanguage.googleapis.com/v1beta/models"

try:
    response = httpx.get(
        url,
        params={"key": api_key},
        timeout=30
    )

    print("STATUS:", response.status_code)

    response.raise_for_status()

    for model in response.json().get("models", []):
        methods = model.get("supportedGenerationMethods", [])

        if "generateContent" in methods:
            print(
                model.get("name"),
                "|",
                model.get("displayName")
            )

except Exception as error:
    print("ERROR:", str(error))
