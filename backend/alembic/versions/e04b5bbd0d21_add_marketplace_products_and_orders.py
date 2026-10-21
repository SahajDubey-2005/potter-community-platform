"""Add marketplace product listings and orders."""

from alembic import op
import sqlalchemy as sa


revision = "e04b5bbd0d21"
down_revision = "c47a9ec91d42"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "marketplace_products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("description", sa.String(2000), nullable=False),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("image_url", sa.String(1000), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_marketplace_products_id", "marketplace_products", ["id"])
    op.create_index("ix_marketplace_products_seller_id", "marketplace_products", ["seller_id"])
    op.create_index("ix_marketplace_products_is_active", "marketplace_products", ["is_active"])

    op.create_table(
        "marketplace_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("items", sa.JSON(), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.String(24), nullable=False, server_default="REQUESTED"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_marketplace_orders_id", "marketplace_orders", ["id"])
    op.create_index("ix_marketplace_orders_user_id", "marketplace_orders", ["user_id"])
    op.create_index("ix_marketplace_orders_status", "marketplace_orders", ["status"])


def downgrade():
    op.drop_index("ix_marketplace_orders_status", table_name="marketplace_orders")
    op.drop_index("ix_marketplace_orders_user_id", table_name="marketplace_orders")
    op.drop_index("ix_marketplace_orders_id", table_name="marketplace_orders")
    op.drop_table("marketplace_orders")
    op.drop_index("ix_marketplace_products_is_active", table_name="marketplace_products")
    op.drop_index("ix_marketplace_products_seller_id", table_name="marketplace_products")
    op.drop_index("ix_marketplace_products_id", table_name="marketplace_products")
    op.drop_table("marketplace_products")
