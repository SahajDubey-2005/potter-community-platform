"""seed editable community committee role templates

Revision ID: f14bb21e8d1a
Revises: f83d104a6b21
Create Date: 2026-10-17
"""

from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f14bb21e8d1a"
down_revision: Union[str, Sequence[str], None] = "f83d104a6b21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ROLE_TEMPLATES = [
    ("President / Head", "Elected committee lead; oversight and authorized committee approvals.", ["membership.view", "reports.view", "community.records.view", "community.approve"]),
    ("Secretary", "Elected officer for notices, meetings, official records, and community events.", ["membership.view", "reports.view", "announcements.manage", "events.manage", "community.records.view", "community.records.manage"]),
    ("Treasurer", "Elected officer for fee policy, transaction records, and finance reporting.", ["membership.view", "reports.view", "finance.manage"]),
    ("Director", "Read-only committee oversight; no approval or record-changing permissions.", ["membership.view", "reports.view", "community.records.view"]),
    ("Nominated Director", "Read-only committee oversight; no approval or record-changing permissions.", ["membership.view", "reports.view", "community.records.view"]),
    ("Verification Officer", "Reviews member documents and verification applications.", ["membership.view", "documents.review", "membership.review"]),
    ("Scholarship Officer", "Reviews scholarship applications and eligibility evidence.", ["membership.view", "scholarships.review", "reports.view"]),
    ("Matrimonial Coordinator", "Reviews matrimonial applications with privacy controls.", ["membership.view", "matrimonial.review"]),
    ("Event Coordinator", "Coordinates event publication, registration, and attendance.", ["membership.view", "events.manage", "community.records.view"]),
    ("Media Coordinator", "Publishes approved announcements and event updates.", ["membership.view", "announcements.manage", "community.records.view"]),
    ("Legal Grievance Coordinator", "Coordinates grievance follow-up and committee reporting.", ["membership.view", "reports.view", "community.records.view"]),
    ("Potter Market Engagement Coordinator", "Coordinates engagement with pottery sellers and marketplace activity.", ["membership.view", "marketplace.manage", "reports.view"]),
]


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
    existing = {name.lower() for (name,) in bind.execute(sa.select(roles.c.name)).all()}
    now = datetime.now(timezone.utc)
    rows = [
        {"name": name, "description": description, "permissions": permissions, "is_active": True, "created_at": now}
        for name, description, permissions in ROLE_TEMPLATES
        if name.lower() not in existing
    ]
    if rows:
        bind.execute(sa.insert(roles), rows)


def downgrade() -> None:
    bind = op.get_bind()
    roles = sa.table("roles", sa.column("id", sa.Integer), sa.column("name", sa.String))
    users = sa.table("users", sa.column("role_id", sa.Integer))
    names = [name for name, _, _ in ROLE_TEMPLATES]
    assigned = sa.exists(sa.select(users.c.role_id).where(users.c.role_id == roles.c.id))
    bind.execute(sa.delete(roles).where(roles.c.name.in_(names), ~assigned))
