"""add persistent treasurer finance records

Revision ID: 6b2d4a318fce
Revises: 71e4ca908fb2
Create Date: 2026-10-17
"""

from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6b2d4a318fce"
down_revision: Union[str, Sequence[str], None] = "71e4ca908fb2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "finance_policy",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("registration_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("renewal_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("event_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("updated_by_id", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["updated_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "financial_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_reference", sa.String(length=40), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("payment_type", sa.String(length=40), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("payer_name", sa.String(length=160), nullable=False),
        sa.Column("payer_email", sa.String(length=255), nullable=True),
        sa.Column("transaction_reference", sa.String(length=160), nullable=False),
        sa.Column("source", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("receipt_number", sa.String(length=40), nullable=False),
        sa.Column("reconciled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_by_id", sa.Integer(), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reconciled_by_id", sa.Integer(), nullable=True),
        sa.Column("reconciled_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["verified_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["reconciled_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_reference"),
        sa.UniqueConstraint("transaction_reference"),
        sa.UniqueConstraint("receipt_number"),
    )
    for column in ("id", "public_reference", "user_id", "status", "transaction_reference"):
        unique = column in {"public_reference", "transaction_reference"}
        op.create_index(f"ix_financial_transactions_{column}", "financial_transactions", [column], unique=unique)
    op.create_table(
        "financial_refunds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_reference", sa.String(length=40), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("reason", sa.String(length=1000), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["transaction_id"], ["financial_transactions.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_reference"),
    )
    op.create_index("ix_financial_refunds_id", "financial_refunds", ["id"])
    op.create_index("ix_financial_refunds_transaction_id", "financial_refunds", ["transaction_id"])
    op.create_index("ix_financial_refunds_status", "financial_refunds", ["status"])
    op.bulk_insert(
        sa.table("finance_policy", sa.column("id", sa.Integer), sa.column("updated_at", sa.DateTime(timezone=True))),
        [{"id": 1, "updated_at": datetime.now(timezone.utc)}],
    )


def downgrade() -> None:
    op.drop_index("ix_financial_refunds_status", table_name="financial_refunds")
    op.drop_index("ix_financial_refunds_transaction_id", table_name="financial_refunds")
    op.drop_index("ix_financial_refunds_id", table_name="financial_refunds")
    op.drop_table("financial_refunds")
    for column in ("transaction_reference", "status", "user_id", "public_reference", "id"):
        op.drop_index(f"ix_financial_transactions_{column}", table_name="financial_transactions")
    op.drop_table("financial_transactions")
    op.drop_table("finance_policy")
