"""Protocol definitions for Blender Agent communication."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class MessageType(str, Enum):
    """Types of messages in the Blender Agent protocol."""
    
    # Requests
    REQUEST = "request"
    RESPONSE = "response"
    ERROR = "error"
    
    # Notifications
    NOTIFICATION = "notification"


@dataclass
class BlenderRequest:
    """A request to be sent to the Blender add-on."""
    
    id: str
    method: str
    params: dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to JSON-RPC compatible dict."""
        return {
            "jsonrpc": "2.0",
            "id": self.id,
            "method": self.method,
            "params": self.params,
        }


@dataclass
class BlenderResponse:
    """A response from the Blender add-on."""
    
    id: str
    result: Any = None
    error: dict[str, Any] | None = None
    
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "BlenderResponse":
        """Create from JSON-RPC response dict."""
        return cls(
            id=data.get("id", ""),
            result=data.get("result"),
            error=data.get("error"),
        )
    
    @property
    def is_error(self) -> bool:
        """Check if this response is an error."""
        return self.error is not None


# Error codes following JSON-RPC spec
class ErrorCode:
    """JSON-RPC error codes."""
    
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603
    
    # Custom error codes (server defined, -32000 to -32099)
    BLENDER_NOT_CONNECTED = -32000
    BLENDER_EXECUTION_ERROR = -32001
    OBJECT_NOT_FOUND = -32002
    OPERATION_FAILED = -32003
