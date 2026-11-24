"""Add Shiprocket pickups, seller-item shipments, and webhook deduplication.

Revision ID: d7a2026c1105
Revises: bc6026ee98df
"""
from alembic import op
import sqlalchemy as sa

revision = "d7a2026c1105"
down_revision = "bc6026ee98df"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "marketplace_seller_pickups",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("pickup_location", sa.String(160), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("seller_id", name="uq_marketplace_seller_pickups_seller"),
    )
    op.create_index("ix_marketplace_seller_pickups_seller_id", "marketplace_seller_pickups", ["seller_id"])
    op.create_table(
        "marketplace_courier_shipments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("marketplace_order_id", sa.Integer(), sa.ForeignKey("marketplace_orders.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("seller_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reference", sa.String(100), nullable=False, unique=True),
        sa.Column("pickup_location", sa.String(160), nullable=False),
        sa.Column("destination_address", sa.String(250), nullable=False),
        sa.Column("destination_city", sa.String(120), nullable=False),
        sa.Column("destination_state", sa.String(120), nullable=False),
        sa.Column("destination_pincode", sa.String(6), nullable=False),
        sa.Column("recipient_email", sa.String(255), nullable=True),
        sa.Column("weight_kg", sa.Numeric(9, 3), nullable=False),
        sa.Column("length_cm", sa.Numeric(9, 2), nullable=False),
        sa.Column("breadth_cm", sa.Numeric(9, 2), nullable=False),
        sa.Column("height_cm", sa.Numeric(9, 2), nullable=False),
        sa.Column("shiprocket_order_id", sa.String(100), nullable=True),
        sa.Column("shiprocket_shipment_id", sa.BigInteger(), nullable=True, unique=True),
        sa.Column("awb_code", sa.String(120), nullable=True),
        sa.Column("courier_name", sa.String(120), nullable=True),
        sa.Column("state", sa.String(32), nullable=False),
        sa.Column("pickup_status", sa.String(100), nullable=True),
        sa.Column("courier_status", sa.String(120), nullable=True),
        sa.Column("last_error", sa.String(500), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("marketplace_order_id", "product_id", name="uq_marketplace_courier_order_product"),
    )
    op.create_index("ix_marketplace_courier_shipments_marketplace_order_id", "marketplace_courier_shipments", ["marketplace_order_id"])
    op.create_index("ix_marketplace_courier_shipments_seller_id", "marketplace_courier_shipments", ["seller_id"])
    op.create_index("ix_marketplace_courier_shipments_awb_code", "marketplace_courier_shipments", ["awb_code"])
    op.create_table(
        "marketplace_courier_webhooks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("payload_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade():
    op.drop_table("marketplace_courier_webhooks")
    op.drop_index("ix_marketplace_courier_shipments_awb_code", table_name="marketplace_courier_shipments")
    op.drop_index("ix_marketplace_courier_shipments_seller_id", table_name="marketplace_courier_shipments")
    op.drop_index("ix_marketplace_courier_shipments_marketplace_order_id", table_name="marketplace_courier_shipments")
    op.drop_table("marketplace_courier_shipments")
    op.drop_index("ix_marketplace_seller_pickups_seller_id", table_name="marketplace_seller_pickups")
    op.drop_table("marketplace_seller_pickups")
