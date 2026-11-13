"""merge emergency and matrimonial migrations

Revision ID: dd1702d2259b
Revises: a621ef03bd72, ab27cd91ef42
Create Date: 2026-11-12 23:14:05.797429

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd1702d2259b'
down_revision: Union[str, Sequence[str], None] = ('a621ef03bd72', 'ab27cd91ef42')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
