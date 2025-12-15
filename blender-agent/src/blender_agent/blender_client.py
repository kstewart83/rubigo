"""TCP client for communicating with the Blender add-on socket server."""

import asyncio
import json
import logging
import uuid
from typing import Any

from .protocol import BlenderRequest, BlenderResponse, ErrorCode

logger = logging.getLogger(__name__)

# Default connection settings
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 9876
CONNECTION_TIMEOUT = 5.0
READ_TIMEOUT = 30.0


class BlenderConnectionError(Exception):
    """Raised when unable to connect to Blender."""
    pass


class BlenderClient:
    """Async TCP client for communicating with the Blender add-on."""
    
    def __init__(
        self,
        host: str = DEFAULT_HOST,
        port: int = DEFAULT_PORT,
    ):
        self.host = host
        self.port = port
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._lock = asyncio.Lock()
    
    @property
    def is_connected(self) -> bool:
        """Check if currently connected to Blender."""
        return self._writer is not None and not self._writer.is_closing()
    
    async def connect(self) -> None:
        """Establish connection to the Blender add-on."""
        if self.is_connected:
            return
        
        try:
            self._reader, self._writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port),
                timeout=CONNECTION_TIMEOUT,
            )
            logger.info(f"Connected to Blender at {self.host}:{self.port}")
        except asyncio.TimeoutError:
            raise BlenderConnectionError(
                f"Timeout connecting to Blender at {self.host}:{self.port}"
            )
        except ConnectionRefusedError:
            raise BlenderConnectionError(
                f"Connection refused. Is Blender running with the add-on enabled? "
                f"(tried {self.host}:{self.port})"
            )
        except Exception as e:
            raise BlenderConnectionError(f"Failed to connect to Blender: {e}")
    
    async def disconnect(self) -> None:
        """Close the connection to Blender."""
        if self._writer:
            self._writer.close()
            try:
                await self._writer.wait_closed()
            except Exception:
                pass
            self._writer = None
            self._reader = None
            logger.info("Disconnected from Blender")
    
    async def send_request(
        self,
        method: str,
        params: dict[str, Any] | None = None,
    ) -> Any:
        """Send a request to Blender and wait for the response.
        
        Args:
            method: The method to call on the Blender add-on
            params: Parameters to pass to the method
            
        Returns:
            The result from Blender
            
        Raises:
            BlenderConnectionError: If not connected or connection fails
            Exception: If Blender returns an error
        """
        async with self._lock:
            if not self.is_connected:
                await self.connect()
            
            request = BlenderRequest(
                id=str(uuid.uuid4()),
                method=method,
                params=params or {},
            )
            
            # Send the request
            message = json.dumps(request.to_dict()) + "\n"
            self._writer.write(message.encode("utf-8"))
            await self._writer.drain()
            
            logger.debug(f"Sent request: {method}")
            
            # Read the response
            try:
                response_line = await asyncio.wait_for(
                    self._reader.readline(),
                    timeout=READ_TIMEOUT,
                )
            except asyncio.TimeoutError:
                raise BlenderConnectionError("Timeout waiting for response from Blender")
            
            if not response_line:
                await self.disconnect()
                raise BlenderConnectionError("Connection closed by Blender")
            
            # Parse the response
            try:
                response_data = json.loads(response_line.decode("utf-8"))
            except json.JSONDecodeError as e:
                raise BlenderConnectionError(f"Invalid JSON response from Blender: {e}")
            
            response = BlenderResponse.from_dict(response_data)
            
            if response.is_error:
                error = response.error
                raise Exception(
                    f"Blender error ({error.get('code', 'unknown')}): "
                    f"{error.get('message', 'Unknown error')}"
                )
            
            return response.result
    
    async def ping(self) -> bool:
        """Check if Blender is responsive.
        
        Returns:
            True if Blender responded, False otherwise
        """
        try:
            result = await self.send_request("ping")
            return result == "pong"
        except Exception:
            return False


# Global client instance
_client: BlenderClient | None = None


def get_client() -> BlenderClient:
    """Get or create the global Blender client instance."""
    global _client
    if _client is None:
        _client = BlenderClient()
    return _client
