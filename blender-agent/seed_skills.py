#!/usr/bin/env python3
"""Seed the skills database with Phase 1: First Steps skills."""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from blender_agent.skills import get_db, Skill


def seed_phase1_skills():
    """Add Phase 1: First Steps skills to the database."""
    db = get_db()
    
    skills = [
        # Viewport Navigation
        Skill(
            name="viewport_navigate",
            category="First Steps",
            chapter=1,
            description="Navigate the 3D viewport (orbit, pan, zoom)",
            parameters_schema={
                "action": {"type": "string", "enum": ["orbit", "pan", "zoom"]},
                "delta": {"type": "array", "description": "[x, y] or zoom factor"},
            },
        ),
        # Selection
        Skill(
            name="select_object",
            category="First Steps",
            chapter=1,
            description="Select an object by name",
            parameters_schema={
                "name": {"type": "string", "description": "Object name to select"},
            },
            verified=True,  # Has core handler
        ),
        # Transform - these map to existing socket server methods
        Skill(
            name="transform_object",
            category="First Steps",
            chapter=1,
            description="Move, rotate, or scale an object",
            parameters_schema={
                "name": {"type": "string"},
                "location": {"type": "array"},
                "rotation": {"type": "array"},
                "scale": {"type": "array"},
            },
            verified=True,  # Already implemented in socket server
        ),
        # Add objects
        Skill(
            name="create_object",
            category="First Steps",
            chapter=1,
            description="Create a primitive object (cube, sphere, cylinder, etc.)",
            parameters_schema={
                "type": {"type": "string", "enum": ["cube", "sphere", "cylinder", "cone", "torus", "plane", "circle", "monkey"]},
                "name": {"type": "string"},
                "location": {"type": "array"},
                "scale": {"type": "array"},
            },
            verified=True,  # Already implemented in socket server
        ),
        # Duplicate
        Skill(
            name="duplicate_object",
            category="First Steps",
            chapter=1,
            description="Duplicate an object",
            parameters_schema={
                "name": {"type": "string", "description": "Object to duplicate"},
                "new_name": {"type": "string", "description": "Optional name for duplicate"},
            },
            verified=True,  # Has core handler
        ),
        # Delete
        Skill(
            name="delete_object",
            category="First Steps",
            chapter=1,
            description="Delete an object by name",
            parameters_schema={
                "name": {"type": "string", "description": "Object name to delete"},
            },
            verified=True,  # Already implemented in socket server
        ),
        # 3D Cursor
        Skill(
            name="set_3d_cursor",
            category="First Steps",
            chapter=1,
            description="Set the 3D cursor position",
            parameters_schema={
                "location": {"type": "array", "description": "[x, y, z] position"},
            },
            verified=True,  # Has core handler
        ),
        # Collections
        Skill(
            name="create_collection",
            category="First Steps",
            chapter=1,
            description="Create a new collection",
            parameters_schema={
                "name": {"type": "string", "description": "Collection name"},
            },
            verified=True,  # Has core handler
        ),
        Skill(
            name="move_to_collection",
            category="First Steps",
            chapter=1,
            description="Move an object to a collection",
            parameters_schema={
                "object_name": {"type": "string"},
                "collection_name": {"type": "string"},
            },
            verified=True,  # Has core handler
        ),
        # Scene info (already implemented)
        Skill(
            name="get_scene_info",
            category="First Steps",
            chapter=1,
            description="Get information about the current scene",
            parameters_schema={
                "include_materials": {"type": "boolean"},
                "include_transforms": {"type": "boolean"},
            },
            verified=True,
        ),
        # Get version (already implemented)
        Skill(
            name="get_version",
            category="First Steps",
            chapter=1,
            description="Get the current Blender version",
            parameters_schema={},
            verified=True,
        ),
    ]
    
    print(f"Seeding database at: {db.db_path}")
    print()
    
    for skill in skills:
        try:
            skill_id = db.add_skill(skill)
            status = "✓ verified" if skill.verified else "○ unverified"
            print(f"  Added: {skill.name} ({status})")
        except Exception as e:
            if "UNIQUE constraint" in str(e):
                print(f"  Skip:  {skill.name} (already exists)")
            else:
                print(f"  Error: {skill.name} - {e}")
    
    print()
    stats = db.get_stats()
    print(f"Total skills: {stats['total_skills']}")
    print(f"Verified: {stats['verified_skills']}")


if __name__ == "__main__":
    seed_phase1_skills()
