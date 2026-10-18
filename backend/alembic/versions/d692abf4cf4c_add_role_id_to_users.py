"""add role id to users

Revision ID: d692abf4cf4c
Revises: 21c475f86f73
Create Date: 2026-10-15

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d692abf4cf4c"
down_revision: Union[str, Sequence[str], None] = "21c475f86f73"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add dynamic role relationship to users."""

    with op.batch_alter_table("users", schema=None) as batch_op:

        batch_op.add_column(
            sa.Column(
                "role_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_foreign_key(
            "fk_users_role_id_roles",
            "roles",
            ["role_id"],
            ["id"],
        )


def downgrade() -> None:
    """Remove dynamic role relationship from users."""

    with op.batch_alter_table("users", schema=None) as batch_op:

        batch_op.drop_constraint(
            "fk_users_role_id_roles",
            type_="foreignkey",
        )

        batch_op.drop_column("role_id")
