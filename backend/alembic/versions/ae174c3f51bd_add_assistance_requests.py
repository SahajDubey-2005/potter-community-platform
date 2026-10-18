"""add private assistance request tracking

Revision ID: ae174c3f51bd
Revises: 8c4d2a7f901b
Create Date: 2026-10-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ae174c3f51bd"
down_revision: Union[str, Sequence[str], None] = "8c4d2a7f901b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assistance_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assistance_type", sa.String(80), nullable=False),
        sa.Column("scope", sa.String(20), nullable=False, server_default="GOVERNMENT"),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="SUBMITTED"),
        sa.Column("decision_reason", sa.String(1000), nullable=True),
        sa.Column("official_status", sa.String(30), nullable=False, server_default="NOT_SUBMITTED"),
        sa.Column("official_verification_note", sa.String(1000), nullable=True),
        sa.Column("official_reference", sa.String(160), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_assistance_applications_user_id", "assistance_applications", ["user_id"])
    op.create_index("ix_assistance_applications_status", "assistance_applications", ["status"])
    op.create_table(
        "assistance_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("assistance_applications.id"), nullable=False),
        sa.Column("document_type", sa.String(120), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_assistance_documents_application_id", "assistance_documents", ["application_id"])
    op.create_table(
        "assistance_benefits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("assistance_applications.id"), nullable=False),
        sa.Column("benefit_type", sa.String(160), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("received_at", sa.Date(), nullable=True),
        sa.Column("reference_number", sa.String(160), nullable=True),
        sa.Column("verification_status", sa.String(24), nullable=False, server_default="PENDING"),
        sa.Column("proof_file_name", sa.String(255), nullable=True),
        sa.Column("recorded_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_assistance_benefits_application_id", "assistance_benefits", ["application_id"])


def downgrade() -> None:
    op.drop_table("assistance_benefits")
    op.drop_table("assistance_documents")
    op.drop_table("assistance_applications")
