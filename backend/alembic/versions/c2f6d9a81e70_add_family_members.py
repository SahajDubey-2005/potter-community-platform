"""add family member records"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2f6d9a81e70"
down_revision: Union[str, Sequence[str], None] = "b523c60ad571"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "family_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("primary_user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("relationship", sa.String(length=60), nullable=False),
        sa.Column("date_of_birth", sa.String(length=10), nullable=True),
        sa.Column("gender", sa.String(length=40), nullable=True),
        sa.Column("phone_number", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("membership_status", sa.String(length=20), server_default="PENDING", nullable=False),
        sa.Column("membership_number", sa.String(length=36), nullable=True),
        sa.Column("admin_remark", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["primary_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("membership_number"),
    )
    op.create_index("ix_family_members_id", "family_members", ["id"])
    op.create_index("ix_family_members_primary_user_id", "family_members", ["primary_user_id"])


def downgrade() -> None:
    op.drop_index("ix_family_members_primary_user_id", table_name="family_members")
    op.drop_index("ix_family_members_id", table_name="family_members")
    op.drop_table("family_members")
