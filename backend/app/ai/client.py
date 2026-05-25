"""
Client wrapper per Gemini API.

Pattern: una classe singleton-like che incapsula la SDK di Google
e fornisce metodi specifici alle nostre esigenze.

Modelli usati:
- gemini-2.5-flash: chat principale (risposte all'utente)
- gemini-2.5-flash-lite: classification, intent, fast tasks
- gemini-embedding-001: embeddings per RAG (768 dim)
"""

import logging
from typing import Any

from google import genai
from google.genai import types

from app.config import settings


logger = logging.getLogger(__name__)


class GeminiClient:
    """Wrapper attorno al GenAI SDK con metodi async."""
    
    def __init__(
        self,
        api_key: str,
        main_model: str,
        fast_model: str,
        embedding_model: str,
    ) -> None:
        self._client = genai.Client(api_key=api_key)
        self.main_model = main_model
        self.fast_model = fast_model
        self.embedding_model = embedding_model
    
    # ============================================================
    # TEXT GENERATION
    # ============================================================
    
    async def generate_text(
        self,
        prompt: str,
        *,
        system_instruction: str | None = None,
        use_fast_model: bool = False,
        temperature: float = 0.7,
        max_output_tokens: int = 2048,
    ) -> str:
        """
        Genera una risposta testuale da un prompt.
        
        Usato per:
        - Chat principale (use_fast_model=False)
        - Intent classification, estrazione (use_fast_model=True)
        
        Restituisce la risposta come stringa.
        """
        model = self.fast_model if use_fast_model else self.main_model
        
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        
        try:
            response = await self._client.aio.models.generate_content(
                model=model,
                contents=prompt,
                config=config,
            )
        except Exception as e:
            logger.exception("Gemini generate_text failed")
            raise GeminiError(f"Errore comunicazione con Gemini: {e}") from e
        
        text = response.text or ""
        if not text:
            logger.warning("Gemini returned empty response")
        
        return text

    async def generate_with_tools(
        self,
        prompt: str,
        *,
        system_instruction: str | None = None,
        tools: list[Any] | None = None,
        temperature: float = 0.7,
        max_output_tokens: int = 2048,
    ) -> tuple[str, list[dict]]:
        """
        Genera una risposta che può includere tool calls.
        
        Restituisce (testo, tool_calls):
        - testo: la parte di risposta testuale (può essere vuota se solo tool calls)
        - tool_calls: lista di dict {name, args} con le chiamate proposte dall'LLM
        
        Se l'LLM non chiama nessun tool, tool_calls è una lista vuota.
        """
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            tools=tools or [],
            # Disabilita il "thinking" esteso di gemini-2.5-flash.
            # Il thinking aggiunge 5-10s di latenza interna prima di iniziare
            # a generare testo. Per chat conversazionali (anche forecasting)
            # non serve: la risposta viene comunque buona ma in 2-3s invece di 10+.
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        
        try:
            response = await self._client.aio.models.generate_content(
                model=self.main_model,
                contents=prompt,
                config=config,
            )
        except Exception as e:
            logger.exception("Gemini generate_with_tools failed")
            raise GeminiError(f"Errore comunicazione con Gemini: {e}") from e
        
        # Estrai testo e tool calls dalla response
        text_parts: list[str] = []
        tool_calls: list[dict] = []
        
        candidate = response.candidates[0] if response.candidates else None
        if candidate and candidate.content and candidate.content.parts:
            for part in candidate.content.parts:
                if hasattr(part, "text") and part.text:
                    text_parts.append(part.text)
                if hasattr(part, "function_call") and part.function_call:
                    fc = part.function_call
                    tool_calls.append({
                        "name": fc.name,
                        "args": dict(fc.args) if fc.args else {},
                    })
        
        text = "".join(text_parts)
        return text, tool_calls
    
    # ============================================================
    # EMBEDDINGS
    # ============================================================
    
    async def embed_text(self, text: str) -> list[float]:
        """
        Genera un embedding 768-dim per il testo dato.
        
        Usato per:
        - Salvare memory_chunks con embedding
        - Cercare memory_chunks rilevanti via similarity
        """
        try:
            response = await self._client.aio.models.embed_content(
                model=self.embedding_model,
                contents=text,
                config=types.EmbedContentConfig(
                    output_dimensionality=768,
                ),
            )
        except Exception as e:
            logger.exception("Gemini embed_text failed")
            raise GeminiError(f"Errore embedding: {e}") from e
        
        if not response.embeddings:
            raise GeminiError("Embedding vuoto restituito da Gemini")
        
        # response.embeddings è una lista (di solito 1 elemento perché passiamo 1 testo)
        return list(response.embeddings[0].values)


class GeminiError(Exception):
    """Errore generico nella comunicazione con Gemini."""
    pass


# ============================================================
# SINGLETON instance
# ============================================================
# Creato all'avvio dell'app (lifespan). Riusato da tutti gli endpoint.

_gemini_client: GeminiClient | None = None


def init_gemini_client() -> GeminiClient:
    """Inizializza il client globale. Da chiamare in lifespan."""
    global _gemini_client
    _gemini_client = GeminiClient(
        api_key=settings.google_api_key,
        main_model=settings.gemini_main_model,
        fast_model=settings.gemini_fast_model,
        embedding_model=settings.gemini_embedding_model,
    )
    logger.info(
        f"Gemini client initialized "
        f"(main={settings.gemini_main_model}, "
        f"fast={settings.gemini_fast_model}, "
        f"embedding={settings.gemini_embedding_model})"
    )
    return _gemini_client


def get_gemini_client() -> GeminiClient:
    """Dependency injection: restituisce il client globale."""
    if _gemini_client is None:
        raise RuntimeError(
            "Gemini client non inizializzato. Manca init_gemini_client() in lifespan?"
        )
    return _gemini_client