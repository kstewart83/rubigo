# Blender Agent

A bridge that enables AI agents to control Blender 5.0 through the Model Context Protocol (MCP).

## Features

- **MCP Server**: Exposes Blender operations as MCP tools for AI agents
- **Blender Extension**: Socket server that runs inside Blender for remote control
- **Antigravity Integration**: Works seamlessly with Google's Antigravity IDE

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Agent      │     │   MCP Server    │     │   Blender 5.0   │
│  (Antigravity)  │────▶│   (Python)      │────▶│   (Extension)   │
│                 │     │                 │     │                 │
│  MCP via STDIO  │     │  TCP :9876      │     │  Socket Server  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Requirements

- Python 3.11+
- Blender 5.0+
- uv (recommended) or pip

## Installation

### 1. Install the MCP Server

```bash
cd blender-agent
uv sync
```

### 2. Deploy the Blender Extension

```bash
# Deploy extension directly to Blender
uv run python deploy_extension.py
```

Then in Blender 5.0:
1. **Restart Blender** if it's open
2. Go to **Edit → Preferences → Get Extensions**
3. Look for "User Default" repository
4. Enable **"Blender Agent Socket Server"**

### 3. Configure Antigravity

Add to your MCP settings:

```json
{
  "mcpServers": {
    "blender": {
      "command": "uv",
      "args": ["run", "--directory", "/path/to/blender-agent", "blender-agent"]
    }
  }
}
```

## Usage

1. Start Blender and ensure the extension is enabled
2. The extension starts a TCP server on port 9876
3. Use MCP tools from your AI agent:

| Tool | Description |
|------|-------------|
| `blender_get_scene_info` | Get scene information |
| `blender_create_object` | Create cube, sphere, etc. |
| `blender_delete_object` | Delete object by name |
| `blender_transform_object` | Move, rotate, scale |
| `blender_set_material` | Apply materials/colors |
| `blender_render` | Render current view |
| `blender_execute_python` | Run Python in Blender |

## Development

```bash
# Install dev dependencies
uv sync --dev

# Deploy extension after changes
uv run python deploy_extension.py

# Then restart Blender to pick up changes

# Run MCP server directly
uv run blender-agent
```

## License

MIT
