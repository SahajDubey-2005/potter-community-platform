"""Preview and remove *explicitly identifiable* Potter Community demo records.

Usage (run from backend/ with the application's normal DATABASE_URL):
    python cleanup_demo_data.py            # READ-ONLY preview
    python cleanup_demo_data.py --apply    # review, confirm, then clean

The tool never removes uploaded files, payment webhooks, marketplace orders,
real user accounts, or records without clear demo markers. Historical records
with dependencies are hidden rather than deleted. Back up the database first.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func

from app.database import SessionLocal
from app.models import (
    CommitteeAssignment,
    CommunityEvent,
    CommunityRecord,
    EventRegistration,
    FinancialTransaction,
    FinancePolicy,
    MarketplaceProduct,
    MatrimonialProfile,
    Notification,
    ScholarshipApplication,
    ScholarshipScheme,
    User,
)


def is_demo_record(row: CommunityRecord) -> bool:
    return (row.title or "").startswith("DEMO -") or (
        row.approval_remark or ""
    ).strip() in {"Demo content", "DEMO DATA - not an official record"}


def is_demo_event(row: CommunityEvent) -> bool:
    return (row.title or "").startswith("DEMO -") or (
        row.approval_remark or ""
    ).strip() in {"Demo content", "DEMO DATA - not an official event"}


def is_demo_scholarship(row: ScholarshipScheme) -> bool:
    return (row.name or "").startswith("DEMO -") or (
        row.provider or ""
    ).strip() in {"Demo listing only", "Potter Community Platform (Demo)"}


def is_demo_matrimonial(row: MatrimonialProfile) -> bool:
    return (row.description or "").strip().lower().startswith(
        "demo profile for testing"
    )


def has_dependents(db, parent_table: str, parent_id: int) -> bool:
    """Never delete a record with references from any migrated table."""
    from sqlalchemy import MetaData, Table, inspect, select

    bind = db.get_bind()
    inspector = inspect(bind)
    for table_name in inspector.get_table_names():
        if table_name == parent_table:
            continue
        for fk in inspector.get_foreign_keys(table_name):
            if fk.get("referred_table") != parent_table:
                continue
            referred_cols = fk.get("referred_columns") or []
            local_cols = fk.get("constrained_columns") or []
            if len(referred_cols) != 1 or referred_cols[0] != "id" or len(local_cols) != 1:
                return True  # unknown dependency: never delete
            table = Table(table_name, MetaData(), autoload_with=bind)
            existing = db.execute(
                select(func.count()).select_from(table).where(
                    table.c[local_cols[0]] == parent_id
                )
            ).scalar_one()
            if existing:
                return True
    return False


def preview(db):
    """Collect candidates without changing anything."""
    records = [row for row in db.query(CommunityRecord).all() if is_demo_record(row) and row.status != "ARCHIVED"]
    events = [row for row in db.query(CommunityEvent).all() if is_demo_event(row) and row.status != "ARCHIVED"]
    scholarships = [row for row in db.query(ScholarshipScheme).all() if is_demo_scholarship(row) and row.is_active]
    notifications = [row for row in db.query(Notification).all() if (row.title or "").startswith("DEMO -")]
    assignments = [row for row in db.query(CommitteeAssignment).all()
                   if (row.assignment_note or "").startswith("DEMO DATA ONLY")]
    finance = [row for row in db.query(FinancialTransaction).all()
               if row.source == "DEMO" and (row.transaction_reference or "").startswith("DEMO-TXN-")]
    matrimonial = [row for row in db.query(MatrimonialProfile).all() if is_demo_matrimonial(row) and row.status != "REJECTED"]
    # Only synthetic accounts using the demo domain are included. Real accounts
    # (including the deliberately created regular-member test login) are excluded.
    users = [row for row in db.query(User).all()
             if (row.email or "").lower().startswith("demo.")
             and (row.email or "").lower().endswith("@pottercommunity.local")
             and (row.is_active or row.membership_status == "APPROVED")]
    # Also detect active demo products even if the synthetic seller was already deactivated.
    all_demo_ids = [row.id for row in db.query(User).all()
                    if (row.email or "").lower().startswith("demo.")
                    and (row.email or "").lower().endswith("@pottercommunity.local")]
    products = db.query(MarketplaceProduct).filter(
        MarketplaceProduct.seller_id.in_(all_demo_ids),
        MarketplaceProduct.is_active.is_(True),
    ).all() if all_demo_ids else []
    return {
        "community_records": records, "community_events": events,
        "scholarship_schemes": scholarships, "notifications": notifications,
        "committee_assignments": assignments, "financial_transactions": finance,
        "matrimonial_profiles": matrimonial, "demo_users": users,
        "demo_seller_products": products,
    }


def display(db, found):
    print("\nPOTTER COMMUNITY — IDENTIFIABLE DEMO RECORDS (PREVIEW)")
    print("No changes have been made.\n")
    for label, rows in found.items():
        print(f"{label}: {len(rows)}")
        for row in rows[:18]:
            detail = getattr(row, "title", None) or getattr(row, "name", None) or (
                getattr(row, "email", None) if label == "demo_users" else None
            ) or getattr(row, "transaction_reference", None) or ""
            print(f"  ID {row.id}: {str(detail)[:110]}")
        if len(rows) > 18:
            print(f"  (+{len(rows) - 18} more)")
    try:
        policy = db.query(FinancePolicy).filter(FinancePolicy.id == 1).first()
        if policy and (
            policy.registration_fee == Decimal("500") and
            policy.renewal_fee == Decimal("250") and
            policy.event_fee == Decimal("100")
        ):
            print("\nREVIEW: membership fees match the old demo seed defaults. These may have been legitimately configured; NOT changed automatically.")
    except Exception:
        pass
    print("\nNot automatically deleted: actual user accounts, marketplace orders, paid/refunded financial history, user-uploaded files, or anything without an explicit demo marker.")
    print("The ordinary test login at potter.regular.member@example.com is NOT deleted by this tool.")


def apply(db, found):
    results = Counter()
    for row in found["community_records"]:
        if has_dependents(db, "community_records", row.id):
            row.status = "ARCHIVED"
            results["community_records_archived_with_dependencies"] += 1
        else:
            db.delete(row)
            results["community_records_removed"] += 1
    for row in found["community_events"]:
        registrations = db.query(EventRegistration.id).filter(EventRegistration.event_id == row.id).count()
        if registrations or has_dependents(db, "community_events", row.id):
            row.status = "ARCHIVED"  # preserve actual registration history
            row.registration_enabled = False
            results["community_events_archived_with_registrations"] += 1
        else:
            db.delete(row)
            results["community_events_removed"] += 1
    for row in found["scholarship_schemes"]:
        applications = db.query(ScholarshipApplication.id).filter(ScholarshipApplication.scheme_id == row.id).count()
        if applications or has_dependents(db, "scholarship_schemes", row.id):
            row.is_active = False  # preserve any existing applications and their documents
            results["scholarships_hidden_with_applications"] += 1
        else:
            db.delete(row)
            results["scholarship_schemes_removed"] += 1
    for row in found["notifications"]:
        db.delete(row)
        results["notifications_removed"] += 1
    for row in found["committee_assignments"]:
        if has_dependents(db, "committee_assignments", row.id):
            row.status = "ENDED"
            row.ended_at = datetime.now(timezone.utc)
            row.end_reason = "Explicit demo assignment ended during cleanup"
            results["demo_committee_assignments_ended"] += 1
        else:
            db.delete(row)  # only explicit DEMO DATA ONLY assignments
            results["demo_committee_assignments_removed"] += 1
    for row in found["financial_transactions"]:
        # A transaction that was verified/reconciled could have a financial
        # significance even if originally a test: leave it for manual review.
        if row.reconciled or row.status != "PENDING_VERIFICATION" or has_dependents(db, "financial_transactions", row.id):
            results["finance_entries_skipped_for_review"] += 1
        else:
            db.delete(row)
            results["demo_financial_transactions_removed"] += 1
    for row in found["matrimonial_profiles"]:
        # Hide, don't delete, because shortlists and moderation history may refer to it.
        row.status = "REJECTED"
        results["demo_matrimonial_profiles_hidden"] += 1
    for row in found["demo_seller_products"]:
        row.is_active = False  # never delete products used by historical orders
        results["demo_seller_products_hidden"] += 1
    for row in found["demo_users"]:
        row.is_active = False
        row.membership_status = "ARCHIVED"  # hides synthetic members from directory
        results["demo_users_deactivated"] += 1
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Make the previewed changes after confirmation")
    args = parser.parse_args()
    db = SessionLocal()
    try:
        found = preview(db)
        display(db, found)
        if not args.apply:
            print("\nFor changes: BACK UP YOUR DATABASE, then run: python cleanup_demo_data.py --apply")
            return
        print("\nWARNING: This changes the connected database. Make a backup first.")
        answer = input("Type REMOVE LABELED DEMO DATA to continue: ").strip()
        if answer != "REMOVE LABELED DEMO DATA":
            print("Cancelled: no changes made.")
            return
        results = apply(db, found)
        db.commit()
        print("\nCleanup committed:")
        for key, count in sorted(results.items()):
            print(f"  {key}: {count}")
        if not results:
            print("  No matching changes needed.")
        print("Refresh the website. Check historical orders separately; they are intentionally preserved.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
