from __future__ import annotations

import os
from typing import List, Dict

try:
    from google import genai
    from google.genai import types
except ImportError as e:
    genai = None
    types = None
    _import_error = e


class GeminiServiceError(RuntimeError):
    pass


def _get_model_name() -> str:
    return os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


def _build_contents(history: List[Dict[str, str]], prompt: str) -> List[types.Content]:
    """Build contents list for the new SDK (role + parts)."""
    contents = []
    for msg in history:
        role = msg.get("role", "user")
        text = msg.get("text", "")
        api_role = "user" if role == "user" else "model"
        contents.append(
            types.Content(role=api_role, parts=[types.Part.from_text(text=text)])
        )
    contents.append(
        types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
    )
    return contents


def generate_reply(history: List[Dict[str, str]], prompt: str, timeout_s: int = 10) -> str:
    """
    Minimal wrapper around google-genai (new SDK).
    - history: list of {"role": "user"|"ai", "text": "..."}
    - prompt: the latest user input
    Returns plain text reply or raises GeminiServiceError on failure.
    """
    if genai is None or types is None:
        raise GeminiServiceError(f"Gemini client not available: {_import_error}")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise GeminiServiceError("Gemini API key is missing; set GEMINI_API_KEY in .env")

    client = genai.Client(api_key=api_key)
    model_name = _get_model_name()

    try:
        contents = _build_contents(history, prompt)
        resp = client.models.generate_content(
            model=model_name,
            contents=contents,
        )
        text = (getattr(resp, "text", None) or "").strip()
        if not text:
            raise GeminiServiceError("Empty response from Gemini")
        return text
    except GeminiServiceError:
        raise
    except Exception as e:
        raise GeminiServiceError(f"Gemini request failed: {e}") from e
