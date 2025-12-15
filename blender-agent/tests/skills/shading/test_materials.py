"""
Skill: Shading
Category: Shading (Chapter 5)

Description:
    Verifies shading skills: create_material, assign_material, 
    set_material_color, set_material_property.
    These skills enable material creation and property configuration.

Pre-test State:
    - Default scene with Cube

Expected Post-test State:
    - Materials created and assigned with configured properties
"""

import pytest


class TestCreateMaterial:
    """Tests for create_material skill."""
    
    def test_create_material(self, blender):
        """Test creating a new material."""
        import uuid
        unique_name = f"TestMat_{uuid.uuid4().hex[:8]}"
        result = blender.send("create_material", {"name": unique_name})
        
        assert result["success"] is True
        assert result["created"] is True
        assert result["use_nodes"] is True
    
    def test_create_existing_material(self, blender):
        """Test creating a material that already exists."""
        blender.send("create_material", {"name": "DupMat"})
        result = blender.send("create_material", {"name": "DupMat"})
        
        assert result["success"] is True
        assert result["created"] is False


class TestAssignMaterial:
    """Tests for assign_material skill."""
    
    def test_assign_material(self, blender):
        """Test assigning a material to an object."""
        blender.send("create_material", {"name": "AssignTest"})
        result = blender.send("assign_material", {
            "object_name": "Cube",
            "material_name": "AssignTest",
        })
        
        assert result["success"] is True
        assert result["object"] == "Cube"
        assert result["material"] == "AssignTest"
    
    def test_assign_nonexistent_material_fails(self, blender):
        """Test that assigning non-existent material fails."""
        with pytest.raises(Exception, match="not found"):
            blender.send("assign_material", {
                "object_name": "Cube",
                "material_name": "NonExistent",
            })


class TestSetMaterialColor:
    """Tests for set_material_color skill."""
    
    def test_set_material_color(self, blender):
        """Test setting material base color."""
        blender.send("create_material", {"name": "ColorTest"})
        result = blender.send("set_material_color", {
            "material_name": "ColorTest",
            "color": [1, 0, 0, 1],
        })
        
        assert result["success"] is True
        assert result["color"] == [1, 0, 0, 1]


class TestSetMaterialProperty:
    """Tests for set_material_property skill."""
    
    def test_set_metallic(self, blender):
        """Test setting metallic property."""
        blender.send("create_material", {"name": "PropTest"})
        result = blender.send("set_material_property", {
            "material_name": "PropTest",
            "property": "metallic",
            "value": 1.0,
        })
        
        assert result["success"] is True
        assert result["property"] == "Metallic"
        assert result["value"] == 1.0
    
    def test_set_roughness(self, blender):
        """Test setting roughness property."""
        blender.send("create_material", {"name": "RoughTest"})
        result = blender.send("set_material_property", {
            "material_name": "RoughTest",
            "property": "roughness",
            "value": 0.2,
        })
        
        assert result["success"] is True
        assert result["property"] == "Roughness"
