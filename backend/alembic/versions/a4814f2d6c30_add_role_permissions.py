"""add permissions to dynamic roles

Revision ID: a4814f2d6c30
Revises: 9b76a45e3c10
Create Date: 2026-10-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4814f2d6c30"
down_revision: Union[str, Sequence[str], None] = "9b76a45e3c10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "roles",
        sa.Column("permissions", sa.JSON(), nullable=False, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_column("roles", "permissions")
