"""add scholarship catalogue, review workflow, and benefit records

Revision ID: 8c4d2a7f901b
Revises: c981d3a06f75
Create Date: 2026-10-17
"""

from datetime import date, datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8c4d2a7f901b"
down_revision: Union[str, Sequence[str], None] = "c981d3a06f75"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scholarship_schemes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("scope", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("provider", sa.String(length=180), nullable=False),
        sa.Column("eligibility", sa.String(length=3000), nullable=False),
        sa.Column("amount", sa.String(length=180), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("required_documents", sa.JSON(), nullable=False),
        sa.Column("application_url", sa.String(length=1000), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_schemes_scope", "scholarship_schemes", ["scope"])
    op.create_table(
        "scholarship_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("scheme_id", sa.Integer(), sa.ForeignKey("scholarship_schemes.id"), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="SUBMITTED"),
        sa.Column("review_stage", sa.String(length=30), nullable=False, server_default="ADMIN_REVIEW"),
        sa.Column("admin_remark", sa.String(length=1000), nullable=True),
        sa.Column("officer_remark", sa.String(length=1000), nullable=True),
        sa.Column("president_remark", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    for table, column in (("scholarship_applications", "user_id"), ("scholarship_applications", "scheme_id"), ("scholarship_applications", "status"), ("scholarship_applications", "review_stage")):
        op.create_index(f"ix_{table}_{column}", table, [column])
    op.create_table(
        "scholarship_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("scholarship_applications.id"), nullable=False),
        sa.Column("document_type", sa.String(length=120), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scholarship_documents_application_id", "scholarship_documents", ["application_id"])
    op.create_table(
        "scholarship_benefits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("scholarship_applications.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("benefit_type", sa.String(length=160), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("received_at", sa.Date(), nullable=True),
        sa.Column("reference_number", sa.String(length=160), nullable=True),
        sa.Column("verification_status", sa.String(length=24), nullable=False, server_default="PENDING"),
        sa.Column("proof_file_name", sa.String(length=255), nullable=True),
        sa.Column("recorded_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    for column in ("application_id", "user_id", "verification_status"):
        op.create_index(f"ix_scholarship_benefits_{column}", "scholarship_benefits", [column])

    bind = op.get_bind()
    admin = bind.execute(sa.text("SELECT id FROM users WHERE UPPER(role) IN ('ADMIN', 'SUPER ADMIN') ORDER BY id LIMIT 1")).first()
    if admin:
        schemes = sa.table(
            "scholarship_schemes",
            sa.column("scope", sa.String), sa.column("name", sa.String), sa.column("provider", sa.String),
            sa.column("eligibility", sa.String), sa.column("amount", sa.String), sa.column("start_date", sa.Date),
            sa.column("deadline", sa.Date), sa.column("required_documents", sa.JSON), sa.column("application_url", sa.String),
            sa.column("is_active", sa.Boolean), sa.column("created_by_id", sa.Integer),
            sa.column("created_at", sa.DateTime(timezone=True)), sa.column("updated_at", sa.DateTime(timezone=True)),
        )
        now = datetime.now(timezone.utc)
        bind.execute(sa.insert(schemes).values(
            scope="CENTRAL",
            name="Scholarships to Young Artistes in Different Cultural Fields",
            provider="Ministry of Culture, Government of India",
            eligibility="Indian nationals aged 18–25, with demonstrated proficiency in the selected art and the training history required by the current official guidelines. Pottery & Ceramics is included under Visual Arts.",
            amount="₹5,000 per month for 2 years (subject to current guidelines)",
            start_date=None,
            deadline=None,
            required_documents=["Proof of age and education", "Artistic proficiency and training evidence"],
            application_url="https://culture.gov.in/award-scholarships-young-artists-different-cultural-fields",
            is_active=True,
            created_by_id=admin.id,
            created_at=now,
            updated_at=now,
        ))


def downgrade() -> None:
    op.drop_table("scholarship_benefits")
    op.drop_table("scholarship_documents")
    op.drop_table("scholarship_applications")
    op.drop_table("scholarship_schemes")
