"""seed the super administrator role template

Revision ID: c981d3a06f75
Revises: 6b2d4a318fce
Create Date: 2026-10-17
"""

from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c981d3a06f75"
down_revision: Union[str, Sequence[str], None] = "6b2d4a318fce"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    roles = sa.table(
        "roles",
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("permissions", sa.JSON),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    exists = bind.execute(sa.select(roles.c.name).where(sa.func.lower(roles.c.name) == "super admin")).first()
    if not exists:
        bind.execute(sa.insert(roles).values(
            name="Super Admin",
            description="Platform control, system configuration, and administrator oversight.",
            permissions=[
                "membership.view", "membership.review", "documents.review", "members.manage",
                "roles.manage", "events.manage", "announcements.manage", "scholarships.review",
                "matrimonial.review", "finance.manage", "reports.view", "community.records.view",
                "community.records.manage", "community.approve", "marketplace.manage",
            ],
            is_active=True,
            created_at=datetime.now(timezone.utc),
        ))


def downgrade() -> None:
    bind = op.get_bind()
    roles = sa.table("roles", sa.column("id", sa.Integer), sa.column("name", sa.String))
    users = sa.table("users", sa.column("role_id", sa.Integer))
    assigned = sa.exists(sa.select(users.c.role_id).where(users.c.role_id == roles.c.id))
    bind.execute(sa.delete(roles).where(sa.func.lower(roles.c.name) == "super admin", ~assigned))
