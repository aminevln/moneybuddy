"""change memory_chunks embedding to vector 768

Revision ID: f2141575761d
Revises: 213b1d59503e
Create Date: 2026-05-12 01:35:47.055163

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector

# revision identifiers, used by Alembic.
revision: str = 'f2141575761d'
down_revision: Union[str, Sequence[str], None] = '213b1d59503e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop dell'indice esistente
    op.drop_index("idx_memory_embedding", table_name="memory_chunks")
    
    # Alter della colonna
    op.alter_column(
        "memory_chunks",
        "embedding",
        existing_type=pgvector.sqlalchemy.vector.VECTOR(dim=1024),
        type_=pgvector.sqlalchemy.vector.VECTOR(dim=768),
        existing_nullable=True,
    )
    
    # Ricrea l'indice con la nuova dimensione
    op.create_index(
        "idx_memory_embedding",
        "memory_chunks",
        ["embedding"],
        unique=False,
        postgresql_using="ivfflat",
        postgresql_with={"lists": 100},
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )


def downgrade() -> None:
    op.drop_index("idx_memory_embedding", table_name="memory_chunks")
    op.alter_column(
        "memory_chunks",
        "embedding",
        existing_type=pgvector.sqlalchemy.vector.VECTOR(dim=768),
        type_=pgvector.sqlalchemy.vector.VECTOR(dim=1024),
        existing_nullable=True,
    )
    op.create_index(
        "idx_memory_embedding",
        "memory_chunks",
        ["embedding"],
        unique=False,
        postgresql_using="ivfflat",
        postgresql_with={"lists": 100},
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )