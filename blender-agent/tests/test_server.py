"""Tests for the MCP server."""

import pytest


def test_imports():
    """Test that the package can be imported."""
    from blender_agent import main
    from blender_agent.server import create_server
    from blender_agent.blender_client import BlenderClient
    from blender_agent.protocol import BlenderRequest, BlenderResponse


def test_server_creation():
    """Test that the MCP server can be created."""
    from blender_agent.server import create_server
    
    server = create_server()
    assert server is not None
    assert server.name == "blender-agent"


def test_request_serialization():
    """Test BlenderRequest to dict conversion."""
    from blender_agent.protocol import BlenderRequest
    
    request = BlenderRequest(
        id="test-123",
        method="get_scene_info",
        params={"include_materials": True},
    )
    
    data = request.to_dict()
    
    assert data["jsonrpc"] == "2.0"
    assert data["id"] == "test-123"
    assert data["method"] == "get_scene_info"
    assert data["params"]["include_materials"] is True


def test_response_deserialization():
    """Test BlenderResponse from dict conversion."""
    from blender_agent.protocol import BlenderResponse
    
    # Success response
    response = BlenderResponse.from_dict({
        "jsonrpc": "2.0",
        "id": "test-123",
        "result": {"scene_name": "Scene"},
    })
    
    assert response.id == "test-123"
    assert response.result["scene_name"] == "Scene"
    assert not response.is_error
    
    # Error response
    error_response = BlenderResponse.from_dict({
        "jsonrpc": "2.0",
        "id": "test-456",
        "error": {"code": -32601, "message": "Method not found"},
    })
    
    assert error_response.id == "test-456"
    assert error_response.is_error
    assert error_response.error["code"] == -32601
