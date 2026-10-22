"""Store private election proof documents with committee assignments."""

from alembic import op
import sqlalchemy as sa


revision = "6b39e1f0a2c4"
down_revision = "f93a4d2b71c0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "committee_election_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("assignment_id", sa.Integer(), sa.ForeignKey("committee_assignments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_committee_election_documents_id", "committee_election_documents", ["id"])
    op.create_index("ix_committee_election_documents_assignment_id", "committee_election_documents", ["assignment_id"])


def downgrade():
    op.drop_index("ix_committee_election_documents_assignment_id", table_name="committee_election_documents")
    op.drop_index("ix_committee_election_documents_id", table_name="committee_election_documents")
    op.drop_table("committee_election_documents")
