"""Persist verified members' matrimonial shortlists.

Revision ID: f8e2026b2218
Revises: d7a2026c1105
"""
from alembic import op
import sqlalchemy as sa

revision = "f8e2026b2218"
down_revision = "d7a2026c1105"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "matrimonial_shortlists",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("matrimonial_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "profile_id", name="uq_matrimonial_shortlist_user_profile"),
    )
    op.create_index("ix_matrimonial_shortlists_user_id", "matrimonial_shortlists", ["user_id"])
    op.create_index("ix_matrimonial_shortlists_profile_id", "matrimonial_shortlists", ["profile_id"])


def downgrade():
    op.drop_index("ix_matrimonial_shortlists_profile_id", table_name="matrimonial_shortlists")
    op.drop_index("ix_matrimonial_shortlists_user_id", table_name="matrimonial_shortlists")
    op.drop_table("matrimonial_shortlists")
