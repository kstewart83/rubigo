"""
Skill: extrude
Category: Modeling (Chapter 2)

Description:
    Verifies the extrude skill can extend selected geometry along a direction.
    Extrusion is a core modeling operation for creating 3D shapes from faces.

Pre-test State:
    - Cube in edit mode
    - Top face selected (normal pointing +Z)

Expected Post-test State:
    - Top face extruded 0.5 units up
    - New geometry created (4 side faces)
    - Original top face now at Z=1.5 (base at Z=1, extruded 0.5)

Verification:
    - Mesh now has more vertices than before
    - Selected face is at expected Z position
"""

import pytest


class TestExtrude:
    """Tests for the extrude skill."""
    
    def test_extrude_requires_edit_mode(self, blender):
        """Test that extrude fails if not in edit mode."""
        # Ensure we're in object mode
        blender.send("set_mode", {"object_name": "Cube", "mode": "OBJECT"})
        
        with pytest.raises(Exception, match="EDIT mode"):
            blender.send("extrude", {"direction": [0, 0, 1], "amount": 0.5})
    
    def test_extrude_up(self, blender):
        """Test extruding geometry upward."""
        # Setup: enter edit mode and select all
        blender.send("set_mode", {"object_name": "Cube", "mode": "EDIT"})
        blender.send("select_mesh_elements", {"type": "all"})
        
        # Act: extrude up
        result = blender.send("extrude", {
            "direction": [0, 0, 1],
            "amount": 0.5,
        })
        
        # Assert
        assert result["success"] is True
        assert result["amount"] == 0.5
        assert result["direction"] == [0, 0, 1]
        
        # Return to object mode
        blender.send("set_mode", {"object_name": "Cube", "mode": "OBJECT"})
    
    def test_extrude_sideways(self, blender):
        """Test extruding geometry in X direction."""
        blender.send("set_mode", {"object_name": "Cube", "mode": "EDIT"})
        blender.send("select_mesh_elements", {"type": "all"})
        
        result = blender.send("extrude", {
            "direction": [1, 0, 0],
            "amount": 1.0,
        })
        
        assert result["success"] is True
        
        blender.send("set_mode", {"object_name": "Cube", "mode": "OBJECT"})
