"""Add public help and support enquiries."""

from alembic import op
import sqlalchemy as sa


revision = "8fd31c64a2b7"
down_revision = "6b39e1f0a2c4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "support_inquiries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone_number", sa.String(length=20), nullable=True),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("message", sa.String(length=3000), nullable=False),
        sa.Column("status", sa.String(length=24), server_default="NEW", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_support_inquiries_id", "support_inquiries", ["id"])
    op.create_index("ix_support_inquiries_status", "support_inquiries", ["status"])


def downgrade():
    op.drop_index("ix_support_inquiries_status", table_name="support_inquiries")
    op.drop_index("ix_support_inquiries_id", table_name="support_inquiries")
    op.drop_table("support_inquiries")
