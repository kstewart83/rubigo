"""
Skill: Camera Control
Category: Camera (Phase 7)

Description:
    Verifies camera control skills: create_camera, set_camera_position,
    frame_object.

Pre-test State:
    - Default scene

Expected Post-test State:
    - Camera created and positioned
"""

import pytest
import math


class TestCreateCamera:
    """Tests for create_camera skill."""
    
    def test_create_perspective_camera(self, blender):
        """Test creating a perspective camera."""
        import uuid
        name = f"TestCam_{uuid.uuid4().hex[:8]}"
        result = blender.send("create_camera", {
            "name": name,
            "type": "PERSP",
            "lens": 35,
        })
        
        assert result["success"] is True
        assert result["name"] == name
        assert result["type"] == "PERSP"
    
    def test_create_orthographic_camera(self, blender):
        """Test creating an orthographic camera."""
        import uuid
        name = f"OrthoCam_{uuid.uuid4().hex[:8]}"
        result = blender.send("create_camera", {
            "name": name,
            "type": "ORTHO",
            "ortho_scale": 10,
        })
        
        assert result["success"] is True
        assert result["type"] == "ORTHO"


class TestSetCameraPosition:
    """Tests for set_camera_position skill."""
    
    def test_set_position(self, blender):
        """Test setting camera position."""
        import uuid
        cam_name = f"PosCam_{uuid.uuid4().hex[:8]}"
        blender.send("create_camera", {"name": cam_name})
        
        result = blender.send("set_camera_position", {
            "camera_name": cam_name,
            "location": [5, -5, 3],
        })
        
        assert result["success"] is True
        assert result["location"][0] == pytest.approx(5, abs=0.01)
    
    def test_look_at_object(self, blender):
        """Test pointing camera at an object."""
        import uuid
        cam_name = f"LookCam_{uuid.uuid4().hex[:8]}"
        blender.send("create_camera", {"name": cam_name, "location": [0, -5, 2]})
        blender.send("create_object", {"type": "cube", "name": "LookTarget"})
        
        result = blender.send("set_camera_position", {
            "camera_name": cam_name,
            "look_at": "LookTarget",
        })
        
        assert result["success"] is True


class TestFrameObject:
    """Tests for frame_object skill."""
    
    def test_frame_cube(self, blender):
        """Test framing camera to fit a cube."""
        import uuid
        cam_name = f"FrameCam_{uuid.uuid4().hex[:8]}"
        cube_name = f"FrameCube_{uuid.uuid4().hex[:8]}"
        
        blender.send("create_camera", {"name": cam_name, "type": "ORTHO"})
        blender.send("create_object", {"type": "cube", "name": cube_name})
        
        result = blender.send("frame_object", {
            "camera_name": cam_name,
            "object_name": cube_name,
            "margin": 1.2,
        })
        
        assert result["success"] is True
        assert result["ortho_scale"] is not None
