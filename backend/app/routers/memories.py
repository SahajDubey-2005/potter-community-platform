from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import PotteryMemory, User

router = APIRouter(prefix="/profile/memories", tags=["Profile memories"])
MEMORY_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "profile_memories"
MEMORY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _memory_out(item: PotteryMemory) -> dict:
    return {"id": item.id, "caption": item.caption, "created_at": item.created_at.isoformat() if item.created_at else None, "content_type": item.content_type}


@router.get("")
def list_my_memories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(PotteryMemory).filter(PotteryMemory.user_id == current_user.id).order_by(PotteryMemory.created_at.desc(), PotteryMemory.id.desc()).all()
    return [_memory_out(row) for row in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_memory(file: UploadFile = File(...), caption: str = Form(""), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Choose a JPG, PNG, or WEBP image.")
    if len(caption.strip()) > 500:
        raise HTTPException(status_code=400, detail="Caption must be 500 characters or fewer.")
    content = await file.read(MAX_IMAGE_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The selected image is empty.")
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Each memory photo must be 8 MB or smaller.")
    signatures = {
        "image/jpeg": content.startswith(b"\xff\xd8\xff"),
        "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP",
    }
    if not signatures.get(content_type, False):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid supported image.")
    user_dir = MEMORY_UPLOAD_DIR / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)
    destination = user_dir / f"{uuid4().hex}{ALLOWED_TYPES[content_type]}"
    destination.write_bytes(content)
    row = PotteryMemory(user_id=current_user.id, caption=caption.strip() or None, image_path=str(destination), content_type=content_type, created_at=datetime.now(timezone.utc))
    try:
        db.add(row)
        db.commit()
        db.refresh(row)
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise
    return _memory_out(row)


@router.get("/{memory_id}/image")
def get_memory_image(memory_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(PotteryMemory).filter(PotteryMemory.id == memory_id, PotteryMemory.user_id == current_user.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Memory photo not found.")
    path = Path(row.image_path).resolve()
    if not path.is_file() or MEMORY_UPLOAD_DIR.resolve() not in path.parents:
        raise HTTPException(status_code=404, detail="Memory photo file is unavailable.")
    return FileResponse(path, media_type=row.content_type, filename=path.name)


@router.delete("/{memory_id}")
def delete_memory(memory_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(PotteryMemory).filter(PotteryMemory.id == memory_id, PotteryMemory.user_id == current_user.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Memory photo not found.")
    path = Path(row.image_path)
    db.delete(row)
    db.commit()
    path.unlink(missing_ok=True)
    return {"message": "Memory photo deleted successfully."}
