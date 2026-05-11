"""
Esegue tutti i seed manuali.

Uso: cd backend && uv run python -m scripts.seed
Oppure: make seed
"""

import asyncio

from app.db.session import AsyncSessionLocal
from app.seed.system_categories import seed_system_categories


async def main():
    async with AsyncSessionLocal() as db:
        created = await seed_system_categories(db)
        print(f"✅ Created {created} system categories")


if __name__ == "__main__":
    asyncio.run(main())