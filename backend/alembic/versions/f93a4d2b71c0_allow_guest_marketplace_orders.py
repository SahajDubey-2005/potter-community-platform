"""Allow guest marketplace orders with buyer delivery details."""

from alembic import op
import sqlalchemy as sa


revision = "f93a4d2b71c0"
down_revision = "e04b5bbd0d21"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("marketplace_orders") as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=True)
        batch_op.add_column(sa.Column("buyer_name", sa.String(160), nullable=True))
        batch_op.add_column(sa.Column("buyer_phone", sa.String(20), nullable=True))
        batch_op.add_column(sa.Column("buyer_email", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("delivery_address", sa.String(1000), nullable=True))


def downgrade():
    with op.batch_alter_table("marketplace_orders") as batch_op:
        batch_op.drop_column("delivery_address")
        batch_op.drop_column("buyer_email")
        batch_op.drop_column("buyer_phone")
        batch_op.drop_column("buyer_name")
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=False)
