"""Link marketplace orders to verified Razorpay payments and refunds.

Revision ID: bc6026ee98df
Revises: a28d910bce47
"""
from alembic import op
import sqlalchemy as sa

revision = "bc6026ee98df"
down_revision = "a28d910bce47"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("marketplace_orders") as batch:
        batch.add_column(sa.Column("payment_status", sa.String(24), nullable=False, server_default="UNPAID"))
        batch.add_column(sa.Column("payment_reference", sa.String(100), nullable=True))
        batch.add_column(sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.create_table(
        "marketplace_payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("marketplace_order_id", sa.Integer(), sa.ForeignKey("marketplace_orders.id"), nullable=False),
        sa.Column("razorpay_order_id", sa.String(100), nullable=False, unique=True),
        sa.Column("razorpay_payment_id", sa.String(100), nullable=True, unique=True),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_marketplace_payments_id", "marketplace_payments", ["id"])
    op.create_index("ix_marketplace_payments_marketplace_order_id", "marketplace_payments", ["marketplace_order_id"])
    op.create_index("ix_marketplace_payments_razorpay_order_id", "marketplace_payments", ["razorpay_order_id"])
    op.create_index("ix_marketplace_payments_status", "marketplace_payments", ["status"])
    op.create_table(
        "marketplace_payment_refunds",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("marketplace_payment_id", sa.Integer(), sa.ForeignKey("marketplace_payments.id"), nullable=False),
        sa.Column("razorpay_refund_id", sa.String(100), nullable=False, unique=True),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("reason", sa.String(500), nullable=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_marketplace_payment_refunds_id", "marketplace_payment_refunds", ["id"])
    op.create_index("ix_marketplace_payment_refunds_marketplace_payment_id", "marketplace_payment_refunds", ["marketplace_payment_id"])
    op.create_index("ix_marketplace_payment_refunds_razorpay_refund_id", "marketplace_payment_refunds", ["razorpay_refund_id"])
    op.create_index("ix_marketplace_payment_refunds_status", "marketplace_payment_refunds", ["status"])
    op.create_table(
        "marketplace_payment_webhooks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(128), nullable=False, unique=True),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_marketplace_payment_webhooks_id", "marketplace_payment_webhooks", ["id"])
    op.create_index("ix_marketplace_payment_webhooks_event_id", "marketplace_payment_webhooks", ["event_id"])


def downgrade():
    op.drop_index("ix_marketplace_payment_webhooks_event_id", table_name="marketplace_payment_webhooks")
    op.drop_index("ix_marketplace_payment_webhooks_id", table_name="marketplace_payment_webhooks")
    op.drop_table("marketplace_payment_webhooks")
    for key in ("status", "razorpay_refund_id", "marketplace_payment_id", "id"):
        op.drop_index(f"ix_marketplace_payment_refunds_{key}", table_name="marketplace_payment_refunds")
    op.drop_table("marketplace_payment_refunds")
    for key in ("status", "razorpay_order_id", "marketplace_order_id", "id"):
        op.drop_index(f"ix_marketplace_payments_{key}", table_name="marketplace_payments")
    op.drop_table("marketplace_payments")
    with op.batch_alter_table("marketplace_orders") as batch:
        batch.drop_column("paid_at")
        batch.drop_column("payment_reference")
        batch.drop_column("payment_status")
