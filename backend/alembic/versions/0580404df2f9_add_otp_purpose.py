"""add OTP purpose

Revision ID: 0580404df2f9
Revises: 3dec6b0e72af
Create Date: 2026-10-13 00:01:51.148127

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0580404df2f9'
down_revision: Union[str, Sequence[str], None] = '3dec6b0e72af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add purpose to phone OTP records."""
    op.add_column(
        "phone_otps",
        sa.Column(
            "purpose",
            sa.String(length=30),
            nullable=False,
            server_default="phone_verification",
        ),
    )


def downgrade() -> None:
    """Remove purpose from phone OTP records."""
    op.drop_column("phone_otps", "purpose")