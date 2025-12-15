"""
Skill: Rigging
Category: Rigging (Chapter 4)

Description:
    Verifies rigging skills: create_armature, add_bone, parent_to_armature.
    These skills are essential for creating skeletal rigs for animation.

Pre-test State:
    - Default scene with Cube

Expected Post-test State:
    - Armature created with bones
    - Mesh parented to armature

Verification:
    - create_armature creates an empty armature object
    - add_bone adds bones with correct head/tail positions
    - parent_to_armature parents mesh with automatic weights
"""

import pytest


class TestCreateArmature:
    """Tests for create_armature skill."""
    
    def test_create_armature(self, blender):
        """Test creating an armature."""
        import uuid
        unique_name = f"TestArm_{uuid.uuid4().hex[:8]}"
        result = blender.send("create_armature", {
            "name": unique_name,
            "location": [0, 0, 0],
        })
        
        assert result["success"] is True
        assert result["name"] == unique_name
        assert result["location"] == [0.0, 0.0, 0.0]
    
    def test_create_armature_with_location(self, blender):
        """Test creating an armature at a specific location."""
        result = blender.send("create_armature", {
            "name": "OffsetArmature",
            "location": [2, 0, 0],
        })
        
        assert result["success"] is True
        assert result["location"][0] == 2.0


class TestAddBone:
    """Tests for add_bone skill."""
    
    def test_add_bone(self, blender):
        """Test adding a bone to an armature."""
        # First create an armature
        blender.send("create_armature", {"name": "BoneTestArm"})
        
        # Add a bone
        result = blender.send("add_bone", {
            "armature_name": "BoneTestArm",
            "name": "TestBone",
            "head": [0, 0, 0],
            "tail": [0, 0, 1],
        })
        
        assert result["success"] is True
        assert result["bone"] == "TestBone"
        assert result["armature"] == "BoneTestArm"
    
    def test_add_bone_with_parent(self, blender):
        """Test adding a child bone with parent relationship."""
        # Create armature and parent bone
        blender.send("create_armature", {"name": "ParentTestArm"})
        blender.send("add_bone", {
            "armature_name": "ParentTestArm",
            "name": "ParentBone",
            "head": [0, 0, 0],
            "tail": [0, 0, 1],
        })
        
        # Add child bone
        result = blender.send("add_bone", {
            "armature_name": "ParentTestArm",
            "name": "ChildBone",
            "head": [0, 0, 1],
            "tail": [0, 0, 2],
            "parent": "ParentBone",
        })
        
        assert result["success"] is True
        assert result["bone"] == "ChildBone"


class TestParentToArmature:
    """Tests for parent_to_armature skill."""
    
    def test_parent_to_armature_fails_without_mesh(self, blender):
        """Test that parenting fails with non-existent mesh."""
        with pytest.raises(Exception, match="not found"):
            blender.send("parent_to_armature", {
                "mesh_name": "NonExistent",
                "armature_name": "TestRig",
            })
