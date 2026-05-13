"""
Test rapido di Gemini.

Uso:
  cd backend && uv run python -m scripts.test_gemini

Output atteso: una risposta di Gemini al prompt "Ciao, come ti chiami?"
"""

import asyncio

from app.ai.client import init_gemini_client


async def main():
    print("🤖 Inizializzo Gemini...")
    client = init_gemini_client()
    
    print(f"📝 Mando prompt di test al modello {client.main_model}...")
    response = await client.generate_text(
        prompt="Ciao! Presentati in una frase breve, in italiano.",
        temperature=0.5,
    )
    print(f"\n✅ Risposta ricevuta:\n{response}\n")
    
    print(f"🧮 Test embedding con modello {client.embedding_model}...")
    embedding = await client.embed_text("Pranzo al bar")
    print(f"✅ Embedding generato: {len(embedding)} dimensioni")
    print(f"   Primi 5 valori: {embedding[:5]}")


if __name__ == "__main__":
    asyncio.run(main())