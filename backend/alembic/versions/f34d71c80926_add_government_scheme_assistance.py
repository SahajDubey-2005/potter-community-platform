"""Add community assistance requests for government scheme listings.

Revision ID: f34d71c80926
Revises: e1a3c9b80261
"""
from alembic import op
import sqlalchemy as sa

revision = "f34d71c80926"
down_revision = "e1a3c9b80261"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "government_scheme_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("scheme_id", sa.String(120), nullable=False),
        sa.Column("scheme_title", sa.String(180), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("review_remark", sa.String(1000), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_government_scheme_requests_user_id", "government_scheme_requests", ["user_id"])
    op.create_index("ix_government_scheme_requests_scheme_id", "government_scheme_requests", ["scheme_id"])
    op.create_index("ix_government_scheme_requests_status", "government_scheme_requests", ["status"])
    op.create_table(
        "government_scheme_request_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("government_scheme_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("stored_name", sa.String(255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_government_scheme_request_documents_application_id", "government_scheme_request_documents", ["application_id"])


def downgrade():
    op.drop_index("ix_government_scheme_request_documents_application_id", table_name="government_scheme_request_documents")
    op.drop_table("government_scheme_request_documents")
    op.drop_index("ix_government_scheme_requests_status", table_name="government_scheme_requests")
    op.drop_index("ix_government_scheme_requests_scheme_id", table_name="government_scheme_requests")
    op.drop_index("ix_government_scheme_requests_user_id", table_name="government_scheme_requests")
    op.drop_table("government_scheme_requests")
