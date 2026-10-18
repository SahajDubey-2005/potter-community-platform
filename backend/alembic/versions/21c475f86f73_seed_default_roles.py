"""seed default roles

Revision ID: 21c475f86f73
Revises: ced2228b9278
Create Date: 2026-10-14 22:15:11.999767

"""

from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "21c475f86f73"
down_revision: Union[str, Sequence[str], None] = "ced2228b9278"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed the default system roles."""

    roles_table = sa.table(
        "roles",
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )

    now = datetime.now(timezone.utc)

    op.bulk_insert(
        roles_table,
        [
            {
                "name": "ADMIN",
                "description": "System administrator",
                "is_active": True,
                "created_at": now,
            },
            {
                "name": "ARTISAN",
                "description": "Registered potter/artisan",
                "is_active": True,
                "created_at": now,
            },
            {
                "name": "CITIZEN",
                "description": "Registered citizen/member",
                "is_active": True,
                "created_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove the default system roles."""

    roles_table = sa.table(
        "roles",
        sa.column("name", sa.String),
    )

    op.execute(
        roles_table.delete().where(
            roles_table.c.name.in_(
                ["ADMIN", "ARTISAN", "CITIZEN"]
            )
        )
    )