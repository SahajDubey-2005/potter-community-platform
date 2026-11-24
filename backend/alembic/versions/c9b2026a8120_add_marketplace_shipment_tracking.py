"""Add secure tracking details to marketplace orders.

Revision ID: c9b2026a8120
Revises: f7a12c9d4e80
"""
from alembic import op
import sqlalchemy as sa

revision = "c9b2026a8120"
down_revision = "f7a12c9d4e80"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("marketplace_orders", sa.Column("tracking_number", sa.String(length=48), nullable=True))
    op.add_column("marketplace_orders", sa.Column("tracking_access_hash", sa.String(length=64), nullable=True))
    op.create_index("ix_marketplace_orders_tracking_number", "marketplace_orders", ["tracking_number"], unique=True)


def downgrade():
    op.drop_index("ix_marketplace_orders_tracking_number", table_name="marketplace_orders")
    op.drop_column("marketplace_orders", "tracking_access_hash")
    op.drop_column("marketplace_orders", "tracking_number")
