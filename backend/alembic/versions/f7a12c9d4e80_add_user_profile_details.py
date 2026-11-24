"""Add persisted editable profile details to users.

Revision ID: f7a12c9d4e80
Revises: dd1702d2259b
Create Date: 2026-11-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7a12c9d4e80"
down_revision: Union[str, Sequence[str], None] = "dd1702d2259b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_details", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_details")
