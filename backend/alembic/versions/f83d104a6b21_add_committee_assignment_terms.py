"""add committee assignment terms and history

Revision ID: f83d104a6b21
Revises: c2f6d9a81e70
Create Date: 2026-10-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f83d104a6b21"
down_revision: Union[str, Sequence[str], None] = "c2f6d9a81e70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "committee_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("assigned_by_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("term_start", sa.Date(), nullable=True),
        sa.Column("term_end", sa.Date(), nullable=True),
        sa.Column("minutes_reference", sa.String(length=255), nullable=True),
        sa.Column("assignment_note", sa.String(length=1000), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_by_id", sa.Integer(), nullable=True),
        sa.Column("end_reason", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.ForeignKeyConstraint(["assigned_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["ended_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_committee_assignments_user_id", "committee_assignments", ["user_id"])
    op.create_index("ix_committee_assignments_role_id", "committee_assignments", ["role_id"])
    op.create_index("ix_committee_assignments_status", "committee_assignments", ["status"])


def downgrade() -> None:
    op.drop_index("ix_committee_assignments_status", table_name="committee_assignments")
    op.drop_index("ix_committee_assignments_role_id", table_name="committee_assignments")
    op.drop_index("ix_committee_assignments_user_id", table_name="committee_assignments")
    op.drop_table("committee_assignments")
