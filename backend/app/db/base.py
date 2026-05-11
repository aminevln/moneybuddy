"""
Base class per i modelli ORM SQLAlchemy.

Tutti i modelli del progetto (User, Transaction, ecc.) erediteranno
da Base. SQLAlchemy usa Base per sapere quali tabelle gestire e per
generare le migration con Alembic.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class astratta. Non corrisponde a nessuna tabella.
    
    Quando definiremo modelli (es. User, Transaction), erediteranno
    da questa classe ed SQLAlchemy raccoglierà i loro metadati in
    Base.metadata, che useremo poi con Alembic.
    """
    pass