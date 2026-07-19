from collections.abc import AsyncIterator
from time import perf_counter

from fastapi import HTTPException
from groq import AsyncGroq, APIError

from app.config.settings import get_settings


class GroqLLMService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = AsyncGroq(api_key=self.settings.groq_api_key) if self.settings.groq_api_key else None

    def _messages(self, prompt: str, history: list[dict]) -> list[dict]:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are MediAI, an enterprise medical assistant. Provide evidence-grounded, cautious medical information. "
                    "Use retrieved context when available, cite sources, identify emergency red flags, and always recommend "
                    "professional medical care for diagnosis or treatment decisions. Never invent citations."
                ),
            }
        ]
        messages.extend({"role": item["role"], "content": item["content"]} for item in history[-8:])
        messages.append({"role": "user", "content": prompt})
        return messages

    async def complete(self, prompt: str, history: list[dict]) -> tuple[str, dict]:
        if self.client is None:
            raise HTTPException(status_code=503, detail="GROQ_API_KEY is required for AI responses")
        started = perf_counter()
        try:
            response = await self.client.chat.completions.create(
                model=self.settings.groq_model,
                messages=self._messages(prompt, history),
                temperature=0.2,
                max_tokens=1600,
            )
        except APIError as exc:
            # Only retry on transient errors (rate limit or server error); propagate client errors immediately
            status_code = getattr(exc, "status_code", None)
            if status_code is not None and status_code < 500 and status_code != 429:
                raise HTTPException(status_code=502, detail="LLM request error") from exc
            try:
                response = await self.client.chat.completions.create(
                    model=self.settings.fallback_groq_model,
                    messages=self._messages(prompt, history),
                    temperature=0.2,
                    max_tokens=1200,
                )
            except APIError as fallback_exc:
                raise HTTPException(status_code=503, detail="LLM service unavailable") from fallback_exc
        usage = response.usage.model_dump() if response.usage else {}
        usage["latency_ms"] = round((perf_counter() - started) * 1000, 2)
        return response.choices[0].message.content or "", usage

    async def stream(self, prompt: str, history: list[dict]) -> AsyncIterator[str]:
        if self.client is None:
            raise HTTPException(status_code=503, detail="GROQ_API_KEY is required for AI responses")
        stream = await self.client.chat.completions.create(
            model=self.settings.groq_model,
            messages=self._messages(prompt, history),
            temperature=0.2,
            max_tokens=1600,
            stream=True,
        )
        async for chunk in stream:
            token = chunk.choices[0].delta.content
            if token:
                yield token
