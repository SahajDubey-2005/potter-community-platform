"""add phone verification status

Revision ID: bba33ffca8be
Revises: 33edf257a45b
Create Date: 2026-10-10 22:36:24.343390

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bba33ffca8be'
down_revision: Union[str, Sequence[str], None] = '33edf257a45b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "phone_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )


def downgrade() -> None:
    op.drop_column("users", "phone_verified")