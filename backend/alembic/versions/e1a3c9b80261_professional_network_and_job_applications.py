"""Activate the Professional Network and persist job applications.

Revision ID: e1a3c9b80261
Revises: c9b2026a8120

The older professionals.py used Base.metadata.create_all at import time.
This migration creates missing tables without deleting or overwriting tables
that may already hold professional data in an existing installation.
"""
from alembic import op
import sqlalchemy as sa

revision = "e1a3c9b80261"
down_revision = "c9b2026a8120"
branch_labels = None
depends_on = None


def _create_if_missing(name, *columns, indexes=(), constraints=()):
    inspector = sa.inspect(op.get_bind())
    if name not in inspector.get_table_names():
        op.create_table(name, *columns, *constraints)
    inspector = sa.inspect(op.get_bind())
    existing_indexes = {idx["name"] for idx in inspector.get_indexes(name)}
    for index_name, cols, unique in indexes:
        if index_name not in existing_indexes:
            op.create_index(index_name, name, cols, unique=unique)


def upgrade():
    _create_if_missing(
        "professional_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("profession", sa.String(120), nullable=False),
        sa.Column("headline", sa.String(180)),
        sa.Column("bio", sa.Text()),
        sa.Column("city", sa.String(100)),
        sa.Column("state", sa.String(100)),
        sa.Column("experience_years", sa.Integer(), nullable=False),
        sa.Column("qualifications", sa.Text()),
        sa.Column("specialization", sa.String(160)),
        sa.Column("organization", sa.String(180)),
        sa.Column("designation", sa.String(140)),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("services", sa.JSON(), nullable=False),
        sa.Column("portfolio_url", sa.String(500)),
        sa.Column("linkedin_url", sa.String(500)),
        sa.Column("github_url", sa.String(500)),
        sa.Column("website_url", sa.String(500)),
        sa.Column("consultation_mode", sa.String(40)),
        sa.Column("availability", sa.String(180)),
        sa.Column("price_range", sa.String(100)),
        sa.Column("profile_photo_url", sa.String(500)),
        sa.Column("verification_status", sa.String(24), nullable=False),
        sa.Column("verification_remark", sa.String(1000)),
        sa.Column("is_featured", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        indexes=(
            ("ix_professional_profiles_id", ["id"], False),
            ("ix_professional_profiles_user_id", ["user_id"], True),
            ("ix_professional_profiles_category", ["category"], False),
            ("ix_professional_profiles_city", ["city"], False),
            ("ix_professional_profiles_state", ["state"], False),
            ("ix_professional_profiles_verification_status", ["verification_status"], False),
        ),
    )
    _create_if_missing(
        "professional_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("professional_profiles.id"), nullable=False),
        sa.Column("document_type", sa.String(100), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("stored_name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("remark", sa.String(1000)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        indexes=(
            ("ix_professional_documents_id", ["id"], False),
            ("ix_professional_documents_profile_id", ["profile_id"], False),
            ("ix_professional_documents_status", ["status"], False),
        ),
    )
    _create_if_missing(
        "professional_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("organization", sa.String(180)),
        sa.Column("location", sa.String(160)),
        sa.Column("job_type", sa.String(40), nullable=False),
        sa.Column("apply_url", sa.String(500)),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        indexes=(
            ("ix_professional_jobs_id", ["id"], False),
            ("ix_professional_jobs_created_by_id", ["created_by_id"], False),
            ("ix_professional_jobs_category", ["category"], False),
            ("ix_professional_jobs_status", ["status"], False),
        ),
    )
    _create_if_missing(
        "professional_enquiries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("professional_profiles.id"), nullable=False),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("enquiry_type", sa.String(40), nullable=False),
        sa.Column("subject", sa.String(180)),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        indexes=(
            ("ix_professional_enquiries_id", ["id"], False),
            ("ix_professional_enquiries_profile_id", ["profile_id"], False),
            ("ix_professional_enquiries_sender_id", ["sender_id"], False),
        ),
    )
    _create_if_missing(
        "professional_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("professional_profiles.id"), nullable=False),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(1200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        indexes=(
            ("ix_professional_reviews_id", ["id"], False),
            ("ix_professional_reviews_profile_id", ["profile_id"], False),
        ),
    )
    _create_if_missing(
        "professional_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("professional_profiles.id"), nullable=False),
        sa.Column("reporter_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reason", sa.String(120), nullable=False),
        sa.Column("details", sa.String(1000)),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        indexes=(
            ("ix_professional_reports_id", ["id"], False),
            ("ix_professional_reports_profile_id", ["profile_id"], False),
        ),
    )
    _create_if_missing(
        "professional_job_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("professional_jobs.id"), nullable=False),
        sa.Column("applicant_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("full_name", sa.String(160), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("location", sa.String(180), nullable=False),
        sa.Column("qualification", sa.String(300), nullable=False),
        sa.Column("experience", sa.String(60)),
        sa.Column("cover_letter", sa.Text()),
        sa.Column("resume_original_name", sa.String(255), nullable=False),
        sa.Column("resume_stored_name", sa.String(80), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("employer_remark", sa.String(1000)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        constraints=(sa.UniqueConstraint("job_id", "applicant_id", name="uq_professional_job_applications_job_applicant"),),
        indexes=(
            ("ix_professional_job_applications_id", ["id"], False),
            ("ix_professional_job_applications_job_id", ["job_id"], False),
            ("ix_professional_job_applications_applicant_id", ["applicant_id"], False),
            ("ix_professional_job_applications_status", ["status"], False),
        ),
    )


def downgrade():
    # Keep the six legacy professional tables, since they may predate this
    # migration and contain customer-owned profiles, jobs, and documents.
    # Job application records and private uploaded files are intentionally
    # not deleted by a reversible schema migration.
    op.drop_table("professional_job_applications")
