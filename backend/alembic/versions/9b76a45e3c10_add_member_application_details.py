"""add member application details

Revision ID: 9b76a45e3c10
Revises: d692abf4cf4c
Create Date: 2026-10-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9b76a45e3c10"
down_revision: Union[str, Sequence[str], None] = "d692abf4cf4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("application_details", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "application_details")
