"""add account balance trigger on transactions

Revision ID: XXXXX
Revises: PREVIOUS_REVISION
Create Date: ...

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector


# revision identifiers, used by Alembic.
# NON TOCCARE: questi vengono settati da Alembic, mantieni quelli del tuo file
revision: str = "91e4fe65dcd3"
down_revision: Union[str, None] = "f2141575761d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ============================================================
# TRIGGER LOGIC
# ============================================================
# Quando una transazione viene INSERITA con status='cleared' e non voided,
# aggiorna il balance dell'account.
#
# Quando una transazione viene UPDATED:
# - Se passa da cleared a voided: sottrai dall'effetto sul balance
# - Se passa da voided a cleared: aggiungi (riattivazione)
# - Altri cambiamenti: niente impatto sul balance (i campi finanziari sono immutabili per design)
#
# Quando una transazione viene DELETED (hard delete, raro):
# - Se era cleared: revert l'effetto
#
# Nota: questo trigger usa amount * (direction_sign), dove:
#   - income → +amount
#   - expense → -amount
#   - transfer → 0 (i transfer li gestiremo separatamente in 3.E con doppia transazione)


CREATE_TRIGGER_FUNCTION_SQL = """
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    delta NUMERIC(14, 2) := 0;
    direction_sign INT;
BEGIN
    -- Calcola il segno in base alla direction
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'cleared' AND NEW.voided_at IS NULL THEN
            direction_sign := CASE NEW.direction
                WHEN 'income' THEN 1
                WHEN 'expense' THEN -1
                ELSE 0
            END;
            delta := NEW.amount * direction_sign;
            UPDATE accounts SET current_balance = current_balance + delta
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    
    ELSIF TG_OP = 'UPDATE' THEN
        -- Vecchio impatto sul balance (da rimuovere)
        IF OLD.status = 'cleared' AND OLD.voided_at IS NULL THEN
            direction_sign := CASE OLD.direction
                WHEN 'income' THEN 1
                WHEN 'expense' THEN -1
                ELSE 0
            END;
            delta := delta - (OLD.amount * direction_sign);
        END IF;
        
        -- Nuovo impatto (da aggiungere)
        IF NEW.status = 'cleared' AND NEW.voided_at IS NULL THEN
            direction_sign := CASE NEW.direction
                WHEN 'income' THEN 1
                WHEN 'expense' THEN -1
                ELSE 0
            END;
            delta := delta + (NEW.amount * direction_sign);
        END IF;
        
        -- Applica il delta solo se non-zero
        IF delta != 0 THEN
            UPDATE accounts SET current_balance = current_balance + delta
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'cleared' AND OLD.voided_at IS NULL THEN
            direction_sign := CASE OLD.direction
                WHEN 'income' THEN 1
                WHEN 'expense' THEN -1
                ELSE 0
            END;
            delta := -(OLD.amount * direction_sign);
            UPDATE accounts SET current_balance = current_balance + delta
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
"""


DROP_TRIGGER_FUNCTION_SQL = "DROP FUNCTION IF EXISTS update_account_balance() CASCADE;"


CREATE_TRIGGER_SQL = """
CREATE TRIGGER trg_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();
"""


DROP_TRIGGER_SQL = "DROP TRIGGER IF EXISTS trg_update_account_balance ON transactions;"


# ============================================================
# MIGRATION
# ============================================================

def upgrade() -> None:
    op.execute(CREATE_TRIGGER_FUNCTION_SQL)
    op.execute(CREATE_TRIGGER_SQL)


def downgrade() -> None:
    op.execute(DROP_TRIGGER_SQL)
    op.execute(DROP_TRIGGER_FUNCTION_SQL)