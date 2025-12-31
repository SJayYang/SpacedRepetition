import json
import os
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_authenticated_supabase

router = APIRouter()

PRESETS_DIR = os.path.join(os.path.dirname(__file__), "data")


@router.get("/")
async def list_presets():
    """List available preset lists."""
    presets = []

    for filename in os.listdir(PRESETS_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(PRESETS_DIR, filename)
            with open(filepath, "r") as f:
                data = json.load(f)
                presets.append({
                    "id": filename.replace(".json", ""),
                    "name": data.get("name"),
                    "description": data.get("description"),
                    "problem_count": len(data.get("problems", []))
                })

    return presets


@router.get("/{preset_name}")
async def get_preset(preset_name: str):
    """Get preset list details."""
    filepath = os.path.join(PRESETS_DIR, f"{preset_name}.json")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Preset not found")

    with open(filepath, "r") as f:
        data = json.load(f)

    return data


@router.post("/{preset_name}/import")
async def import_preset(
    preset_name: str,
    collection_id: UUID,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """Import preset to user's collection."""
    filepath = os.path.join(PRESETS_DIR, f"{preset_name}.json")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Preset not found")

    with open(filepath, "r") as f:
        preset_data = json.load(f)

    # Verify collection exists and belongs to user
    collection_response = supabase.table("collections") \
        .select("id") \
        .eq("id", str(collection_id)) \
        .eq("user_id", user["id"]) \
        .single() \
        .execute()

    if not collection_response.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Prepare items for insertion
    items_to_insert = []
    for problem in preset_data.get("problems", []):
        items_to_insert.append({
            "user_id": user["id"],
            "collection_id": str(collection_id),
            "title": problem.get("title"),
            "external_id": problem.get("external_id"),
            "external_url": problem.get("external_url"),
            "metadata": problem.get("metadata", {}),
        })

    # Insert items
    items_response = supabase.table("items").insert(items_to_insert).execute()

    # Create scheduling states
    scheduling_states = []
    for item in items_response.data:
        scheduling_states.append({
            "item_id": item["id"],
            "user_id": user["id"],
            "status": "new",
            "next_review_at": datetime.utcnow().isoformat(),
        })

    supabase.table("scheduling_states").insert(scheduling_states).execute()

    return {
        "message": f"Imported {len(items_response.data)} problems from {preset_data.get('name')}",
        "items_created": len(items_response.data)
    }
