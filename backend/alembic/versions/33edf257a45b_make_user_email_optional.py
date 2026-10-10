"""make user email optional

Revision ID: 33edf257a45b
Revises: bdfbcb99fbb2
Create Date: 2026-10-10 22:10:00.941990

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33edf257a45b'
down_revision: Union[str, Sequence[str], None] = 'bdfbcb99fbb2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "email",
            existing_type=sa.String(),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "email",
            existing_type=sa.String(),
            nullable=False,
        )