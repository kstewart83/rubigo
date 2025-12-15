"""
Skill: Quit Blender
Category: Fundamentals

Description:
    Verifies quit_blender skill - graceful Blender exit.

NOTE: This test actually quits Blender, so it should be run last
or in isolation.
"""

import pytest


class TestQuitBlender:
    """Tests for quit_blender skill."""
    
    @pytest.mark.skip(reason="This would actually quit Blender")
    def test_quit_blender(self, blender):
        """Test gracefully quitting Blender."""
        result = blender.send("quit_blender", {"delay_ms": 1000})
        
        assert result["success"] is True
        assert "will quit" in result["message"]
