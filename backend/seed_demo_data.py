"""Populate demo content for Potter Community Platform.

IMPORTANT:
- Uses existing active, approved users only. Never creates/updates/deletes User rows.
- Adds clearly labelled demo content; does not overwrite existing records.
- Product photos are copied from backend/demo_images into backend/uploads/marketplace.

Run from the backend directory:
    python seed_demo_data.py
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
import shutil

from app.database import SessionLocal
from app.models import (
    User, Role, CommunityRecord, CommunityEvent, MarketplaceProduct,
    ScholarshipScheme, Notification, CommitteeAssignment,
    FinancePolicy, FinancialTransaction,
)

BASE_DIR = Path(__file__).resolve().parent
IMAGE_SOURCE = BASE_DIR / "demo_images"
IMAGE_DEST = BASE_DIR / "uploads" / "marketplace"
NOW = datetime.now(timezone.utc)

PRODUCTS = [
    ("DEMO - Handcrafted Terracotta Water Pot", "Traditional handmade terracotta water pot for home use.", "Utility Pottery", 450, "water_pot.jpg"),
    ("DEMO - Decorative Clay Vase", "Hand-shaped clay vase with a natural earthy finish.", "Home Decor", 650, "clay_vase.jpg"),
    ("DEMO - Traditional Earthen Diyas Set", "Handcrafted clay diyas for festive decoration.", "Festive Items", 180, "diyas.jpg"),
    ("DEMO - Ceramic Serving Bowl", "Hand-finished serving bowl for everyday dining.", "Tableware", 320, "serving_bowl.jpg"),
    ("DEMO - Terracotta Planter", "Breathable clay planter for indoor and balcony plants.", "Garden Pottery", 280, "planter.jpg"),
    ("DEMO - Handmade Kulhad Set", "Traditional clay cups supplied as a set.", "Tableware", 240, "kulhad.jpg"),
    ("DEMO - Decorative Clay Wall Plate", "Decorative plate with a traditional clay-art finish.", "Home Decor", 550, "wall_plate.jpg"),
    ("DEMO - Earthen Storage Jar", "Classic earthen storage jar with a fitted lid.", "Utility Pottery", 700, "storage_jar.jpg"),
    ("DEMO - Clay Incense Holder", "Simple handmade incense holder with an earthy finish.", "Home Decor", 150, "incense_holder.jpg"),
    ("DEMO - Terracotta Tea Cup Set", "A set of handmade terracotta tea cups.", "Tableware", 220, "tea_cup_set.jpg"),
    ("DEMO - Garden Pot Set", "Decorative clay pots for home and garden plants.", "Garden Pottery", 480, "garden_pot.jpg"),
    ("DEMO - Decorative Pottery Showpiece", "Handcrafted pottery showpiece for interior decoration.", "Art Pieces", 360, "decorative_showpiece.jpg"),
]

RECORDS = [
    ("NOTICE", "DEMO - Potter Community Monthly Meeting", "Sample notice: the monthly community meeting will discuss activities, member support and marketplace improvements."),
    ("ACTIVITY", "DEMO - Traditional Pottery Skills Workshop", "Sample activity: clay preparation, wheel throwing, shaping and finishing techniques."),
    ("NOTICE", "DEMO - Marketplace Seller Registration", "Sample notice: approved artisans can showcase handmade pottery products in the marketplace."),
    ("NOTICE", "DEMO - Member Profile Update Reminder", "Sample notice: members can review their contact details and keep profile information up to date."),
    ("ACTIVITY", "DEMO - Product Photography Training", "Sample activity: a session on product photography, packaging and digital marketing."),
    ("MEETING", "DEMO - General Body Meeting", "Demo meeting record: discussion of community development priorities and member services."),
    ("MINUTES", "DEMO - General Body Meeting Minutes", "Demo minutes: reviewed training needs, marketplace improvements and upcoming community activities. These are sample minutes, not an official resolution."),
    ("MEETING", "DEMO - Artisan Welfare Committee Meeting", "Demo meeting record: discussion of artisan welfare, awareness sessions and support programmes."),
    ("MINUTES", "DEMO - Artisan Welfare Meeting Minutes", "Demo minutes: sample discussion summary for layout testing only; not an approved official record."),
    ("MEETING", "DEMO - Marketplace Development Meeting", "Demo meeting record: discussion of product categories, seller onboarding and customer experience."),
]

EVENTS = [
    ("DEMO - Traditional Pottery Exhibition", "Sample exhibition featuring handmade earthenware and decorative pottery.", 12, "10:00 AM", "Community Hall"),
    ("DEMO - Clay Art and Wheel Throwing Workshop", "Sample practical session on clay preparation and wheel throwing.", 20, "11:00 AM", "Pottery Training Centre"),
    ("DEMO - Artisan Community Meet", "Sample gathering for artisans to exchange ideas and discuss community initiatives.", 28, "03:00 PM", "Community Centre"),
    ("DEMO - Terracotta Craft Fair", "Sample craft fair featuring traditional terracotta products.", 36, "10:30 AM", "City Exhibition Ground"),
    ("DEMO - Product Photography Workshop", "Sample session on photographing pottery products for online listings.", 44, "02:00 PM", "Training Room 1"),
    ("DEMO - Sustainable Clay Practices Seminar", "Sample seminar about responsible clay sourcing and production practices.", 52, "11:30 AM", "Community Hall"),
    ("DEMO - Festive Pottery Market", "Sample seasonal marketplace event for handmade pottery.", 60, "09:30 AM", "Community Market"),
    ("DEMO - Artisan Business Awareness Session", "Sample session about packaging, pricing and digital selling.", 68, "01:00 PM", "Pottery Training Centre"),
]

SCHEMES = [
    ("CENTRAL", "DEMO - Traditional Artisan Tool Support", "Demo listing only", "PLACEHOLDER: Sample eligibility for artisans seeking tool support. Not an official government scheme. Verify all details before publication.", "Demo only - no actual benefit"),
    ("CENTRAL", "DEMO - Craft Market Access Programme", "Demo listing only", "PLACEHOLDER: Sample listing for market access support. Not an official government scheme.", "Demo only - no actual benefit"),
    ("STATE", "DEMO - State Handicraft Development Support", "Demo listing only", "PLACEHOLDER: Sample state-level artisan support listing. Not an official government scheme.", "Demo only - no actual benefit"),
    ("STATE", "DEMO - Artisan Training Assistance", "Demo listing only", "PLACEHOLDER: Sample training support listing. Not an official government scheme.", "Demo only - no actual benefit"),
    ("COMMUNITY", "DEMO - Potter Community Skill Workshop", "Potter Community Platform (Demo)", "PLACEHOLDER: Sample community training opportunity for UI testing only.", "Demo only - no actual benefit"),
    ("COMMUNITY", "DEMO - Potter Community Education Support", "Potter Community Platform (Demo)", "PLACEHOLDER: Sample education support listing for UI testing only.", "Demo only - no actual benefit"),
    ("COMMUNITY", "DEMO - Artisan Business Mentoring", "Potter Community Platform (Demo)", "PLACEHOLDER: Sample mentoring opportunity for UI testing only.", "Demo only - no actual benefit"),
    ("COMMUNITY", "DEMO - Community Equipment Sharing", "Potter Community Platform (Demo)", "PLACEHOLDER: Sample shared equipment listing for UI testing only.", "Demo only - no actual benefit"),
]


def existing_users(db):
    return (db.query(User)
            .filter(User.is_active.is_(True), User.membership_status == "APPROVED")
            .order_by(User.id.asc()).all())


def choose_admin(users):
    for user in users:
        legacy = (user.role or "").strip().upper()
        dynamic = (user.role_record.name or "").strip().upper() if user.role_record else ""
        if legacy in {"ADMIN", "SUPER ADMIN"} or dynamic in {"ADMIN", "SUPER ADMIN"}:
            return user
    return users[0]


def copy_product_images():
    IMAGE_DEST.mkdir(parents=True, exist_ok=True)
    copied = 0
    for *_, filename in PRODUCTS:
        source = IMAGE_SOURCE / filename
        target = IMAGE_DEST / filename
        if source.is_file():
            if not target.exists():
                shutil.copy2(source, target)
            copied += 1
        else:
            print(f"WARNING: product image missing: {source}")
    return copied


def add_records(db, admin):
    added = 0
    for kind, title, content in RECORDS:
        found = db.query(CommunityRecord.id).filter(CommunityRecord.title == title).first()
        if not found:
            db.add(CommunityRecord(
                record_type=kind, title=title, content=content,
                status="PUBLISHED", created_by_id=admin.id,
                approved_by_id=admin.id, approval_remark="DEMO DATA - not an official record",
                created_at=NOW, updated_at=NOW,
            ))
            added += 1
    return added


def add_events(db, admin):
    added = 0
    for title, description, days, event_time, venue in EVENTS:
        found = db.query(CommunityEvent.id).filter(CommunityEvent.title == title).first()
        if not found:
            db.add(CommunityEvent(
                title=title, description=description,
                announcement="DEMO EVENT - sample listing only",
                event_date=date.today() + timedelta(days=days),
                event_time=event_time, venue=venue,
                registration_enabled=True, status="PUBLISHED",
                created_by_id=admin.id, approved_by_id=admin.id,
                approval_remark="DEMO DATA - not an official event",
                created_at=NOW, updated_at=NOW,
            ))
            added += 1
    return added


def add_products(db, users):
    added = 0
    for index, (name, description, category, price, filename) in enumerate(PRODUCTS):
        found = db.query(MarketplaceProduct.id).filter(MarketplaceProduct.name == name).first()
        if not found:
            seller = users[index % len(users)]
            image_url = f"/uploads/marketplace/{filename}" if (IMAGE_DEST / filename).is_file() else None
            db.add(MarketplaceProduct(
                seller_id=seller.id, name=name, description=description,
                category=category, price=Decimal(str(price)),
                image_url=image_url, is_active=True,
                created_at=NOW, updated_at=NOW,
            ))
            added += 1
    return added


def add_schemes(db, admin):
    added = 0
    for scope, name, provider, eligibility, amount in SCHEMES:
        found = db.query(ScholarshipScheme.id).filter(ScholarshipScheme.name == name).first()
        if not found:
            db.add(ScholarshipScheme(
                scope=scope, name=name, provider=provider,
                eligibility=eligibility, amount=amount,
                start_date=date.today(), deadline=None,
                required_documents=[], application_url=None,
                is_active=True, created_by_id=admin.id,
                created_at=NOW, updated_at=NOW,
            ))
            added += 1
    return added


def add_notifications(db, users):
    templates = [
        ("DEMO - Community update", "New sample community announcements are available.", "community"),
        ("DEMO - Upcoming event", "A sample pottery workshop has been added to the events calendar.", "events"),
        ("DEMO - Marketplace update", "New sample pottery products have been added to the marketplace.", "marketplace"),
    ]
    added = 0
    for user in users:
        for title, message, category in templates:
            found = db.query(Notification.id).filter(
                Notification.user_id == user.id, Notification.title == title
            ).first()
            if not found:
                db.add(Notification(
                    user_id=user.id, title=title, message=message,
                    category=category, is_read=False, created_at=NOW,
                ))
                added += 1
    return added


def add_committee_demo_assignments(db, users, admin):
    """Add explicitly labelled sample assignments only where none are active."""
    role_names = ["President / Head", "Secretary", "Treasurer", "Director", "Event Coordinator"]
    added = 0
    for index, role_name in enumerate(role_names):
        role = db.query(Role).filter(Role.name.ilike(role_name), Role.is_active.is_(True)).first()
        if role is None or index >= len(users):
            continue
        member = users[index]
        active = db.query(CommitteeAssignment.id).filter(
            CommitteeAssignment.user_id == member.id,
            CommitteeAssignment.status == "ACTIVE",
        ).first()
        if active:
            continue
        db.add(CommitteeAssignment(
            user_id=member.id, role_id=role.id, assigned_by_id=admin.id,
            status="ACTIVE", term_start=date.today(),
            term_end=date.today() + timedelta(days=365),
            assignment_note="DEMO DATA ONLY - not an actual elected or appointed position",
            assigned_at=NOW,
        ))
        added += 1
    return added


def add_finance_demo_data(db, users, admin):
    """Add clearly marked demo transactions; no real payment is represented."""
    if db.query(FinancePolicy.id).filter(FinancePolicy.id == 1).first() is None:
        db.add(FinancePolicy(
            id=1, registration_fee=Decimal("500.00"),
            renewal_fee=Decimal("250.00"), event_fee=Decimal("100.00"),
            updated_by_id=admin.id, updated_at=NOW,
        ))
    added = 0
    demo_rows = [
        ("membership-registration", "250.00", "Sample membership registration"),
        ("membership-renewal", "150.00", "Sample membership renewal"),
        ("event-fee", "100.00", "Sample community event fee"),
        ("donation", "500.00", "Sample community donation"),
        ("marketplace-order", "650.00", "Sample marketplace order"),
    ]
    for index, (payment_type, amount, label) in enumerate(demo_rows, start=1):
        ref = f"DEMO-TXN-{NOW.year}-{index:03d}"
        found = db.query(FinancialTransaction.id).filter(
            FinancialTransaction.transaction_reference == ref
        ).first()
        if not found:
            member = users[(index - 1) % len(users)]
            db.add(FinancialTransaction(
                public_reference=f"DEMO-PAY-{NOW.year}-{index:03d}",
                user_id=member.id, payment_type=payment_type,
                amount=Decimal(amount), payer_name=f"DEMO - {member.full_name}",
                payer_email=None, transaction_reference=ref,
                source="DEMO", status="PENDING_VERIFICATION",
                receipt_number=f"DEMO-ACK-{NOW.year}-{index:03d}",
                reconciled=False, created_at=NOW,
            ))
            added += 1
    return added


def main():
    db = SessionLocal()
    try:
        users = existing_users(db)
        if not users:
            raise RuntimeError("No active, approved accounts found. No demo data was added.")
        admin = choose_admin(users)
        image_count = copy_product_images()
        counts = {
            "community announcements/meetings/minutes": add_records(db, admin),
            "events": add_events(db, admin),
            "marketplace products": add_products(db, users),
            "demo schemes/scholarships": add_schemes(db, admin),
            "notifications across existing users": add_notifications(db, users),
            "demo committee assignments": add_committee_demo_assignments(db, users, admin),
            "demo finance transactions": add_finance_demo_data(db, users, admin),
        }
        db.commit()
        print("\nDEMO SEED COMPLETED")
        print(f"Existing active, approved accounts used: {len(users)}")
        print(f"Product image files available: {image_count}/{len(PRODUCTS)}")
        for label, count in counts.items():
            print(f"New {label}: {count}")
        print("\nNo user accounts were created, deleted, or modified.")
        print("No passwords or membership details were changed.")
        print("Demo schemes, committee assignments and finance rows are explicitly labelled DEMO.")
        print("No fake matrimonial profiles, private identity documents, or assistance applications were created.")
    except Exception as exc:
        db.rollback()
        print("SEED FAILED - database transaction rolled back:", exc)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
