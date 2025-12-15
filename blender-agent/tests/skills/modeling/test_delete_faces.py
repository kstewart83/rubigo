"""
Skill: Delete Faces
Category: Modeling

Description:
    Verifies delete_faces skill - deleting mesh faces by direction or selection.

Pre-test State:
    - Default scene

Expected Post-test State:
    - Cube with specified face(s) removed
"""

import pytest


class TestDeleteFaces:
    """Tests for delete_faces skill."""
    
    def test_delete_front_face(self, blender):
        """Test deleting front-facing faces (-Y direction)."""
        import uuid
        cube_name = f"DelTestCube_{uuid.uuid4().hex[:8]}"
        blender.send("create_object", {"type": "cube", "name": cube_name})
        
        result = blender.send("delete_faces", {
            "object_name": cube_name,
            "direction": [0, -1, 0],  # Front face (-Y normal)
        })
        
        assert result["success"] is True
        assert result["faces_deleted"] == 1
        assert result["object"] == cube_name
    
    def test_delete_top_face(self, blender):
        """Test deleting top-facing faces (+Z direction)."""
        import uuid
        cube_name = f"DelTestCube_{uuid.uuid4().hex[:8]}"
        blender.send("create_object", {"type": "cube", "name": cube_name})
        
        result = blender.send("delete_faces", {
            "object_name": cube_name,
            "direction": [0, 0, 1],  # Top face (+Z normal)
        })
        
        assert result["success"] is True
        assert result["faces_deleted"] == 1
