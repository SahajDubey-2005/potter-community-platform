
import os
import asyncio
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.models import User

router = APIRouter(
    prefix="/community-assistant",
    tags=["AI Community Assistant"]
)

SYSTEM_INSTRUCTION = """You are Potter Community Assistant, a helpful guide for members of an Indian potter community platform.
Help with: platform navigation, membership registration and verification, documents, pottery marketplace, orders, community events, scholarships, government schemes, and general pottery-business guidance.
Be warm, clear, concise, and practical. Reply in the language used by the user (English, Hindi, or Kannada). Use simple wording and numbered steps when explaining procedures.
Important accuracy rules: Never invent scheme names, eligibility rules, deadlines, benefit amounts, government approvals, or platform records. Government scheme rules change; explain that users must confirm current details with the relevant official department/portal. Do not claim to have checked a member's account, order, payment, application, or live status. Direct them to the relevant page or administrator. Do not ask for passwords, OTPs, full Aadhaar/PAN numbers, bank details, or other sensitive credentials. For legal, financial, or medical matters, provide general information and recommend the appropriate qualified/official source. If a question is outside this community context, still try to help safely and honestly."""


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=12
    )


async def request_gemini(url, api_key, body):
    """Call Gemini with retries for temporary failures."""

    retry_status_codes = {429, 500, 502, 503, 504}
    max_attempts = 3

    timeout = httpx.Timeout(
        60.0,
        connect=15.0
    )

    async with httpx.AsyncClient(timeout=timeout) as client:

        for attempt in range(max_attempts):

            try:
                response = await client.post(
                    url,
                    params={"key": api_key},
                    json=body,
                    headers={
                        "Content-Type": "application/json"
                    }
                )

            except httpx.TimeoutException as error:
                print(
                    f"Gemini timeout: attempt "
                    f"{attempt + 1}/{max_attempts}"
                )
                print("TIMEOUT TYPE:", type(error).__name__)
                print("TIMEOUT DETAILS:", str(error))

                if attempt < max_attempts - 1:
                    await asyncio.sleep(2 ** (attempt + 1))
                    continue

                raise HTTPException(
                    status_code=504,
                    detail="Gemini API timed out. Please try again."
                )

                if attempt < max_attempts - 1:
                    await asyncio.sleep(2 ** (attempt + 1))
                    continue

                raise HTTPException(
                    status_code=504,
                    detail="The AI assistant is taking too long to respond. Please try again."
                )

            except httpx.RequestError as error:
                print("Gemini connection error:", str(error))

                if attempt < max_attempts - 1:
                    await asyncio.sleep(2 ** (attempt + 1))
                    continue

                raise HTTPException(
                    status_code=502,
                    detail="Could not connect to the AI service. Please try again."
                )

            # Successful response
            if response.status_code < 400:
                return response

            print("GEMINI API ERROR:", response.status_code)
            print("GEMINI ERROR DETAILS:", response.text[:1000])

            # Retry temporary server/rate-limit errors
            if response.status_code in retry_status_codes:

                if attempt < max_attempts - 1:

                    retry_after = response.headers.get(
                        "Retry-After"
                    )

                    try:
                        wait_time = min(
                            float(retry_after),
                            10
                        ) if retry_after else 2 ** (attempt + 1)

                    except (ValueError, TypeError):
                        wait_time = 2 ** (attempt + 1)

                    print(
                        f"Retrying Gemini in {wait_time} seconds..."
                    )

                    await asyncio.sleep(wait_time)
                    continue

                if response.status_code == 503:
                    raise HTTPException(
                        status_code=503,
                        detail="The AI service is experiencing high demand. Please try again in a minute."
                    )

                if response.status_code == 429:
                    raise HTTPException(
                        status_code=429,
                        detail="The AI service has reached its request limit. Please try again later."
                    )

                if response.status_code == 504:
                    raise HTTPException(
                        status_code=504,
                        detail="The AI service is taking too long to respond. Please try again."
                    )

                raise HTTPException(
                    status_code=502,
                    detail="The AI service is temporarily unavailable. Please try again."
                )

            # Do not retry permanent errors such as invalid requests
            raise HTTPException(
                status_code=502,
                detail="The AI service rejected the request. Check the backend terminal."
            )

    raise HTTPException(
        status_code=502,
        detail="The AI service could not complete your request."
    )


@router.post("/chat")
async def chat_with_community_assistant(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI assistant is not configured. Add GEMINI_API_KEY to the backend .env file."
        )

    model = os.getenv(
        "GEMINI_MODEL",
        "gemini-3.8-flash"
    ).strip()

    contents = [
        {
            "role": item.role,
            "parts": [{"text": item.content}]
        }
        for item in payload.history[-10:]
    ]

    contents.append({
        "role": "user",
        "parts": [{"text": payload.message.strip()}]
    })

    body = {
        "systemInstruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.55,
            "maxOutputTokens": 900
        }
    }

    url = (
        "https://generativelanguage.googleapis.com/"
        f"v1beta/models/{model}:generateContent"
    )

    response = await request_gemini(
        url,
        api_key,
        body
    )

    try:
        data = response.json()

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an invalid response."
        )

    candidates = data.get("candidates", [])

    answer = ""

    if candidates:
        parts = (
            candidates[0]
            .get("content", {})
            .get("parts", [])
        )

        answer = "".join(
            part.get("text", "")
            for part in parts
            if isinstance(part, dict)
        ).strip()

    if not answer:
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an empty response. Please rephrase your question."
        )

    return {
        "reply": answer,
        "model": model
    }
