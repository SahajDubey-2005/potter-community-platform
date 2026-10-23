"""Add community emergency support requests."""

from alembic import op
import sqlalchemy as sa


revision = "a621ef03bd72"
down_revision = "8fd31c64a2b7"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "emergency_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("emergency_type", sa.String(length=80), nullable=False),
        sa.Column("description", sa.String(length=3000), nullable=False),
        sa.Column("location", sa.String(length=500), nullable=False),
        sa.Column("contact_phone", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=24), server_default="NEW", nullable=False),
        sa.Column("review_note", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_emergency_requests_id", "emergency_requests", ["id"])
    op.create_index("ix_emergency_requests_user_id", "emergency_requests", ["user_id"])
    op.create_index("ix_emergency_requests_status", "emergency_requests", ["status"])

    bind = op.get_bind()
    roles = sa.table("roles", sa.column("id", sa.Integer), sa.column("name", sa.String), sa.column("permissions", sa.JSON))
    rows = bind.execute(sa.select(roles.c.id, roles.c.permissions).where(sa.func.lower(roles.c.name) == "legal grievance coordinator")).all()
    for role_id, permissions in rows:
        values = list(permissions or [])
        if "emergency.manage" not in values:
            values.append("emergency.manage")
            bind.execute(sa.update(roles).where(roles.c.id == role_id).values(permissions=values))


def downgrade():
    bind = op.get_bind()
    roles = sa.table("roles", sa.column("id", sa.Integer), sa.column("name", sa.String), sa.column("permissions", sa.JSON))
    rows = bind.execute(sa.select(roles.c.id, roles.c.permissions).where(sa.func.lower(roles.c.name) == "legal grievance coordinator")).all()
    for role_id, permissions in rows:
        values = [permission for permission in (permissions or []) if permission != "emergency.manage"]
        bind.execute(sa.update(roles).where(roles.c.id == role_id).values(permissions=values))
    op.drop_index("ix_emergency_requests_status", table_name="emergency_requests")
    op.drop_index("ix_emergency_requests_user_id", table_name="emergency_requests")
    op.drop_index("ix_emergency_requests_id", table_name="emergency_requests")
    op.drop_table("emergency_requests")
