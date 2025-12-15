#!/usr/bin/env python3
"""Test the skill executor with live Blender connection."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from blender_agent.skill_executor import get_executor
from blender_agent.skills import get_db


async def test_skills():
    """Test various skills through the executor."""
    executor = get_executor()
    db = get_db()
    
    print("=" * 60)
    print("Skill Executor Test")
    print("=" * 60)
    print()
    
    # List available skills
    print("Available skills in database:")
    for skill in db.list_skills():
        verified = "✓" if skill.verified else "○"
        print(f"  {verified} {skill.name} - {skill.description[:50]}...")
    print()
    
    # Test 1: get_version (direct method)
    print("1. Testing get_version (direct method)...")
    result = await executor.execute("get_version", {})
    print(f"   Result: {result}")
    print()
    
    # Test 2: set_3d_cursor (core handler)
    print("2. Testing set_3d_cursor (core handler)...")
    result = await executor.execute("set_3d_cursor", {"location": [1, 2, 3]})
    print(f"   Result: {result}")
    print()
    
    # Test 3: duplicate_object (core handler)
    print("3. Testing duplicate_object (core handler)...")
    result = await executor.execute("duplicate_object", {
        "name": "Sphere",
        "new_name": "Sphere.001"
    })
    print(f"   Result: {result}")
    print()
    
    # Test 4: create_collection (core handler)
    print("4. Testing create_collection (core handler)...")
    result = await executor.execute("create_collection", {"name": "Test Collection"})
    print(f"   Result: {result}")
    print()
    
    # Show execution stats
    print("Execution stats:")
    stats = db.get_stats()
    print(f"  Total skills: {stats['total_skills']}")
    print(f"  Verified: {stats['verified_skills']}")
    
    print()
    print("=" * 60)
    print("Tests complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_skills())
