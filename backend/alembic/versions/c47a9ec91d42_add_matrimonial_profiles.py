"""add matrimonial profiles"""

from alembic import op
import sqlalchemy as sa

revision = "c47a9ec91d42"
down_revision = "b72c9d410f6a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "matrimonial_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("gender", sa.String(20), nullable=False),
        sa.Column("education", sa.String(160), nullable=False),
        sa.Column("occupation", sa.String(160), nullable=False),
        sa.Column("location", sa.String(120), nullable=False),
        sa.Column("marital_status", sa.String(40), nullable=False),
        sa.Column("description", sa.String(1200), nullable=False),
        sa.Column("status", sa.String(24), nullable=False, server_default="PENDING"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_matrimonial_profiles_id", "matrimonial_profiles", ["id"])
    op.create_index("ix_matrimonial_profiles_user_id", "matrimonial_profiles", ["user_id"], unique=True)
    op.create_index("ix_matrimonial_profiles_status", "matrimonial_profiles", ["status"])


def downgrade():
    op.drop_index("ix_matrimonial_profiles_status", table_name="matrimonial_profiles")
    op.drop_index("ix_matrimonial_profiles_user_id", table_name="matrimonial_profiles")
    op.drop_index("ix_matrimonial_profiles_id", table_name="matrimonial_profiles")
    op.drop_table("matrimonial_profiles")
