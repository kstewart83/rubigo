"""Blender Agent - MCP server for controlling Blender 5.0."""

import asyncio
import logging
import sys

from mcp.server.stdio import stdio_server

from .server import create_server

# Configure logging to stderr (stdout is used by MCP protocol)
logging.basicConfig(
    level=logging.DEBUG,
    format="[Blender Agent] %(levelname)s: %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)


async def run_mcp_server():
    """Run the MCP server with stdio transport."""
    server = create_server()
    
    logger.info("MCP server running via STDIO")
    
    async with stdio_server() as (read_stream, write_stream):
        init_options = server.create_initialization_options()
        await server.run(read_stream, write_stream, init_options)


def main() -> None:
    """Entry point for the blender-agent CLI."""
    logger.info("Starting Blender Agent MCP server...")
    try:
        asyncio.run(run_mcp_server())
    except KeyboardInterrupt:
        logger.info("Server stopped")
    except Exception as e:
        logger.error(f"Server error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
