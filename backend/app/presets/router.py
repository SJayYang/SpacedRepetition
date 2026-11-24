import json
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import ensure_profile_exists
from app.items.router import get_items_service
from app.services.items import ItemsService

router = APIRouter()
PRESETS_DIR = Path(__file__).with_name("data")


class ImportPresetRequest(BaseModel):
    collection_id: UUID


def read_preset(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Preset not found") from exc


@router.get("/")
def list_presets():
    presets = []
    for path in PRESETS_DIR.glob("*.json"):
        preset = read_preset(path)
        presets.append({
            "id": path.stem,
            "name": preset.get("name"),
            "description": preset.get("description"),
            "problem_count": len(preset.get("problems", [])),
        })
    return presets


@router.get("/{preset_name}")
def get_preset(preset_name: str):
    return read_preset(PRESETS_DIR / f"{preset_name}.json")


@router.post("/{preset_name}/import")
def import_preset(
    preset_name: str,
    request: ImportPresetRequest,
    service: ItemsService = Depends(get_items_service),
    _: None = Depends(ensure_profile_exists),
):
    preset = get_preset(preset_name)
    problems = preset.get("problems", [])
    created = len(service.import_preset(request.collection_id, problems))
    skipped = len(problems) - created

    if created:
        message = f"Imported {created} problems from {preset.get('name')}"
        if skipped:
            message += f" ({skipped} already existed)"
    else:
        message = f"All {skipped} problems from {preset.get('name')} already exist in this collection"

    return {"message": message, "items_created": created, "items_skipped": skipped}
