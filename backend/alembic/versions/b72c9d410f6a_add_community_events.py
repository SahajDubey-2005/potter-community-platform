"""add reviewed community events and attendance

Revision ID: b72c9d410f6a
Revises: ae174c3f51bd
Create Date: 2026-10-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b72c9d410f6a"
down_revision: Union[str, Sequence[str], None] = "ae174c3f51bd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "community_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("description", sa.String(1200), nullable=False),
        sa.Column("announcement", sa.String(600), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("event_time", sa.String(10), nullable=False),
        sa.Column("venue", sa.String(160), nullable=False),
        sa.Column("registration_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("status", sa.String(24), nullable=False, server_default="PENDING_APPROVAL"),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("approved_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("approval_remark", sa.String(1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_community_events_event_date", "community_events", ["event_date"])
    op.create_index("ix_community_events_status", "community_events", ["status"])
    op.create_table(
        "event_registrations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("community_events.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("registered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attendance_status", sa.String(16), nullable=True),
        sa.Column("attendance_marked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attendance_marked_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.UniqueConstraint("event_id", "user_id", name="uq_event_registration_member"),
    )
    op.create_index("ix_event_registrations_event_id", "event_registrations", ["event_id"])
    op.create_index("ix_event_registrations_user_id", "event_registrations", ["user_id"])


def downgrade() -> None:
    op.drop_table("event_registrations")
    op.drop_table("community_events")
