"""add official community records and meeting minutes

Revision ID: 71e4ca908fb2
Revises: f14bb21e8d1a
Create Date: 2026-10-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "71e4ca908fb2"
down_revision: Union[str, Sequence[str], None] = "f14bb21e8d1a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "community_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("record_type", sa.String(length=24), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("content", sa.String(length=5000), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("venue", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("approved_by_id", sa.Integer(), nullable=True),
        sa.Column("approval_remark", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["approved_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_community_records_id", "community_records", ["id"])
    op.create_index("ix_community_records_record_type", "community_records", ["record_type"])
    op.create_index("ix_community_records_status", "community_records", ["status"])
    op.create_index("ix_community_records_created_by_id", "community_records", ["created_by_id"])


def downgrade() -> None:
    op.drop_index("ix_community_records_created_by_id", table_name="community_records")
    op.drop_index("ix_community_records_status", table_name="community_records")
    op.drop_index("ix_community_records_record_type", table_name="community_records")
    op.drop_index("ix_community_records_id", table_name="community_records")
    op.drop_table("community_records")
