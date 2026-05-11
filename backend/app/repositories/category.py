"""
Repository per Category.

Le categorie hanno due "sorgenti":
- Sistema (user_id IS NULL) → visibili a tutti, non modificabili
- Utente (user_id = X) → visibili solo a quell'utente

Convenzione: tutti i metodi prendono user_id e restituiscono SIA le
categorie di sistema SIA quelle dell'utente. È quello che vuoi
mostrare nella UI: l'utente vede tutto in un'unica lista.
"""

from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # READ
    # ============================================================
    
    async def list_for_user(self, user_id: UUID) -> list[Category]:
        """
        Tutte le categorie visibili a un utente: di sistema + le sue.
        Ordinate per nome.
        """
        result = await self.db.execute(
            select(Category)
            .where(or_(Category.user_id.is_(None), Category.user_id == user_id))
            .order_by(Category.name)
        )
        return list(result.scalars().all())
    
    async def get_by_id_for_user(
        self, category_id: UUID, user_id: UUID
    ) -> Category | None:
        """
        Recupera una categoria che l'utente può vedere
        (sistema o di sua proprietà).
        """
        result = await self.db.execute(
            select(Category).where(
                Category.id == category_id,
                or_(Category.user_id.is_(None), Category.user_id == user_id),
            )
        )
        return result.scalar_one_or_none()
    
    async def get_owned_by_user(
        self, category_id: UUID, user_id: UUID
    ) -> Category | None:
        """
        Recupera una categoria SOLO se appartiene all'utente.
        Le categorie di sistema NON sono ritornate.
        Usata per update/delete: non puoi modificare le categorie di sistema.
        """
        result = await self.db.execute(
            select(Category).where(
                Category.id == category_id,
                Category.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def name_exists_for_user(
        self, name: str, user_id: UUID, exclude_id: UUID | None = None
    ) -> bool:
        """
        Controlla se l'utente ha già una categoria con quel nome.
        Usato per evitare duplicati. exclude_id serve per l'UPDATE
        (escludi te stesso dal check).
        """
        query = select(Category).where(
            Category.user_id == user_id,
            Category.name == name,
        )
        if exclude_id:
            query = query.where(Category.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
    
    # ============================================================
    # WRITE
    # ============================================================
    
    async def create(self, payload: CategoryCreate, user_id: UUID) -> Category:
        """Crea una categoria di proprietà dell'utente."""
        category = Category(
            user_id=user_id,
            name=payload.name,
            parent_id=payload.parent_id,
            icon=payload.icon,
            color=payload.color,
        )
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category
    
    async def update(
        self, category: Category, payload: CategoryUpdate
    ) -> Category:
        """
        Aggiorna i campi forniti (PATCH semantics).
        Solo i campi presenti nel payload vengono toccati.
        """
        # exclude_unset=True → ignora i campi che il client non ha passato
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(category, key, value)
        await self.db.flush()
        await self.db.refresh(category)
        return category
    
    async def delete(self, category: Category) -> None:
        """Elimina una categoria."""
        await self.db.delete(category)
        await self.db.flush()