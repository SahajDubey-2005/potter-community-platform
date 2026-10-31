
"""Add optional photo data to matrimonial profiles."""

from alembic import op
import sqlalchemy as sa


revision = "ab27cd91ef42"
down_revision = "8fd31c64a2b7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "matrimonial_profiles",
        sa.Column("photo_data", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_column("matrimonial_profiles", "photo_data")
