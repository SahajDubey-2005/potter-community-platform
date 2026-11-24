"""Add database-backed community announcements.

Revision ID: a28d910bce47
Revises: f34d71c80926
"""
from alembic import op
import sqlalchemy as sa

revision = "a28d910bce47"
down_revision = "f34d71c80926"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "announcements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("description", sa.String(5000), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("audience", sa.String(32), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False),
        sa.Column("is_pinned", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_announcements_id", "announcements", ["id"])
    op.create_index("ix_announcements_audience", "announcements", ["audience"])
    op.create_index("ix_announcements_status", "announcements", ["status"])
    op.create_index("ix_announcements_expires_at", "announcements", ["expires_at"])


def downgrade():
    op.drop_index("ix_announcements_expires_at", table_name="announcements")
    op.drop_index("ix_announcements_status", table_name="announcements")
    op.drop_index("ix_announcements_audience", table_name="announcements")
    op.drop_index("ix_announcements_id", table_name="announcements")
    op.drop_table("announcements")
