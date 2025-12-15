"""
Skill: Lighting & Rendering
Category: Lighting (Chapter 6)

Description:
    Verifies lighting and rendering skills: create_light, set_world_color,
    set_render_engine, configure_render.

Pre-test State:
    - Default scene

Expected Post-test State:
    - Lights created with properties
    - Render settings configured
"""

import pytest


class TestCreateLight:
    """Tests for create_light skill."""
    
    def test_create_point_light(self, blender):
        """Test creating a point light."""
        result = blender.send("create_light", {
            "type": "POINT",
            "name": "TestPoint",
            "energy": 1000,
        })
        
        assert result["success"] is True
        assert result["type"] == "POINT"
        assert result["energy"] == 1000
    
    def test_create_sun_light(self, blender):
        """Test creating a sun light."""
        result = blender.send("create_light", {
            "type": "SUN",
            "name": "TestSun",
            "energy": 5,
        })
        
        assert result["success"] is True
        assert result["type"] == "SUN"


class TestSetWorldColor:
    """Tests for set_world_color skill."""
    
    def test_set_world_color(self, blender):
        """Test setting world background color."""
        result = blender.send("set_world_color", {
            "color": [0.5, 0.5, 0.5],
            "strength": 1.0,
        })
        
        assert result["success"] is True
        assert result["color"] == [0.5, 0.5, 0.5]
        assert result["strength"] == 1.0


class TestRenderEngine:
    """Tests for render engine settings."""
    
    def test_set_cycles_engine(self, blender):
        """Test setting Cycles render engine."""
        result = blender.send("set_render_engine", {"engine": "CYCLES"})
        
        assert result["success"] is True
        assert result["engine"] == "CYCLES"
    
    def test_set_invalid_engine_fails(self, blender):
        """Test that invalid engine fails."""
        with pytest.raises(Exception, match="Invalid engine"):
            blender.send("set_render_engine", {"engine": "INVALID"})


class TestConfigureRender:
    """Tests for configure_render skill."""
    
    def test_configure_resolution(self, blender):
        """Test configuring render resolution."""
        result = blender.send("configure_render", {
            "resolution_x": 1920,
            "resolution_y": 1080,
        })
        
        assert result["success"] is True
        assert result["resolution"] == [1920, 1080]
