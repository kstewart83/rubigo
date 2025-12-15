"""
Skill: UV Unwrapping
Category: UV Unwrapping (Chapter 3)

Description:
    Verifies UV unwrapping skills: mark_seam, clear_seam, unwrap, project_from_view.
    These skills are essential for preparing meshes for texturing.

Pre-test State:
    - Cube in edit mode with edges selected

Expected Post-test State:
    - UV map created for selected geometry

Verification:
    - mark_seam marks selected edges as seams
    - unwrap creates UV coordinates
    - project_from_view projects UVs from viewport angle
"""

import pytest


class TestMarkSeam:
    """Tests for mark_seam and clear_seam skills."""
    
    def test_mark_seam_requires_edit_mode(self, blender):
        """Test that mark_seam fails if not in edit mode."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "OBJECT"})
        
        with pytest.raises(Exception, match="EDIT mode"):
            blender.send("mark_seam", {})
    
    def test_mark_seam(self, blender):
        """Test marking edges as UV seams."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "EDIT"})
        blender.send("select_mesh_elements", {"type": "all"})
        
        result = blender.send("mark_seam", {})
        
        assert result["success"] is True
        assert result["action"] == "mark_seam"
    
    def test_clear_seam(self, blender):
        """Test clearing UV seams from edges."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "EDIT"})
        blender.send("select_mesh_elements", {"type": "all"})
        
        result = blender.send("clear_seam", {})
        
        assert result["success"] is True
        assert result["action"] == "clear_seam"


class TestUnwrap:
    """Tests for unwrap skill."""
    
    def test_unwrap_requires_edit_mode(self, blender):
        """Test that unwrap fails if not in edit mode."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "OBJECT"})
        
        with pytest.raises(Exception, match="EDIT mode"):
            blender.send("unwrap", {})
    
    def test_unwrap_angle_based(self, blender):
        """Test unwrapping with ANGLE_BASED method."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "EDIT"})
        blender.send("select_mesh_elements", {"type": "all"})
        
        result = blender.send("unwrap", {"method": "ANGLE_BASED"})
        
        assert result["success"] is True
        assert result["method"] == "ANGLE_BASED"
    
    def test_unwrap_conformal(self, blender):
        """Test unwrapping with CONFORMAL method."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "EDIT"})
        blender.send("select_mesh_elements", {"type": "all"})
        
        result = blender.send("unwrap", {"method": "CONFORMAL"})
        
        assert result["success"] is True
        assert result["method"] == "CONFORMAL"


class TestProjectFromView:
    """Tests for project_from_view skill."""
    
    def test_project_from_view_requires_edit_mode(self, blender):
        """Test that project_from_view fails if not in edit mode."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "OBJECT"})
        
        with pytest.raises(Exception, match="EDIT mode"):
            blender.send("project_from_view", {})
    
    def test_project_from_view_ortho(self, blender):
        """Test projecting UVs from orthographic view."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "EDIT"})
        blender.send("select_mesh_elements", {"type": "all"})
        
        result = blender.send("project_from_view", {"orthographic": True})
        
        assert result["success"] is True
        assert result["orthographic"] is True
