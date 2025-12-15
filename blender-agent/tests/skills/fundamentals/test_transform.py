"""
Skill: transform_object
Category: First Steps (Chapter 1)

Description:
    Verifies the transform_object skill can move, rotate, and scale objects.
    This is a fundamental skill used by many higher-level modeling operations.

Pre-test State:
    - Default cube at origin [0, 0, 0]
    - No rotation, scale [1, 1, 1]

Expected Post-test State:
    - Cube moved to [2, 0, 1]
    - Rotated 45° on Z axis
    - Scaled to [1.5, 1.5, 1.5]

Verification:
    - Object location matches expected within tolerance
    - Object rotation matches expected
    - Object scale matches expected
"""

import pytest


class TestTransformObject:
    """Tests for the transform_object skill."""
    
    def test_move_object(self, blender):
        """Test moving an object to a new location."""
        # Setup: ensure we have a cube
        scene = blender.get_scene_objects()
        cube = next((o for o in scene if o["name"] == "Cube"), None)
        assert cube is not None, "Cube not found in scene"
        
        # Act: transform the object
        result = blender.send("transform_object", {
            "name": "Cube",
            "location": [2, 0, 1],
        })
        
        # Assert
        assert result["success"] is True
        assert result["location"] == [2.0, 0.0, 1.0]
    
    def test_rotate_object(self, blender):
        """Test rotating an object."""
        result = blender.send("transform_object", {
            "name": "Cube",
            "rotation": [0, 0, 45],
        })
        
        assert result["success"] is True
        assert abs(result["rotation"][2] - 45.0) < 0.1
    
    def test_scale_object(self, blender):
        """Test scaling an object."""
        result = blender.send("transform_object", {
            "name": "Cube",
            "scale": [1.5, 1.5, 1.5],
        })
        
        assert result["success"] is True
        assert result["scale"] == [1.5, 1.5, 1.5]
    
    def test_combined_transform(self, blender):
        """Test applying multiple transforms at once."""
        result = blender.send("transform_object", {
            "name": "Cube",
            "location": [3, 2, 1],
            "rotation": [0, 0, 90],
            "scale": [2, 2, 2],
        })
        
        assert result["success"] is True
        assert result["location"] == [3.0, 2.0, 1.0]
        assert abs(result["rotation"][2] - 90.0) < 0.1
        assert result["scale"] == [2.0, 2.0, 2.0]
    
    def test_transform_nonexistent_object_fails(self, blender):
        """Test that transforming a non-existent object raises an error."""
        with pytest.raises(Exception, match="not found"):
            blender.send("transform_object", {
                "name": "NonExistentObject",
                "location": [0, 0, 0],
            })
