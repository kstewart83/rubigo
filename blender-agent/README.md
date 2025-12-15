# Blender Agent

A bridge that enables AI agents to control Blender 5.0 through the Model Context Protocol (MCP).

## Features

- **MCP Server**: Exposes Blender operations as MCP tools for AI agents
- **Blender Extension**: Socket server that runs inside Blender for remote control
- **Skill Tracking**: Statistics and call graphs for monitoring skill usage
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

> [!WARNING]
> **Known Issue**: The MCP server can cause crashes or agent errors in Antigravity, especially with Claude models (Gemini models are less affected). If you experience issues, instruct the agent to run the MCP client directly instead:
> ```bash
> uv run python mcp_client.py
> ```

## Available Skills

### Fundamentals
| Skill | Description |
|-------|-------------|
| `ping` | Health check |
| `get_scene_info` | Get scene objects, cameras, lights |
| `create_object` | Create cube, sphere, torus, etc. |
| `delete_object` | Delete object by name |
| `transform_object` | Move, rotate, scale (with animation) |
| `duplicate_object` | Clone an object |
| `set_material` | Apply basic materials |
| `execute_python` | Run arbitrary Python code |
| `save_file` / `open_file` / `new_file` | File operations |
| `get_blender_version` | Get Blender version info |
| `quit_blender` | Graceful shutdown |

### Modeling
| Skill | Description |
|-------|-------------|
| `set_mode` | Switch OBJECT/EDIT/SCULPT modes |
| `select_mesh_elements` | Select verts/edges/faces |
| `extrude` | Extrude selected geometry |
| `loop_cut` | Add loop cuts via subdivide |
| `bevel` | Bevel edges/vertices |
| `inset` | Inset faces |
| `delete_faces` | Delete by direction or selection |
| `add_modifier` / `apply_modifier` | Modifier operations |
| `shade_smooth` | Apply smooth shading |
| `grow_selection` / `shrink_selection` | Expand/contract selection |
| `move_selection` | Move selected vertices |
| `snap_to_mesh` | Snap vertices to target mesh |
| `get_mesh_info` | Get vertex/face counts |
| `get_selection_info` | Info about current selection |

### Shading
| Skill | Description |
|-------|-------------|
| `create_material` | Create a new material |
| `assign_material` | Assign material to object |
| `set_material_color` | Set base color |
| `set_material_property` | Set metallic, roughness, etc. |
| `add_image_texture` | Add texture node |

### Camera
| Skill | Description |
|-------|-------------|
| `create_camera` | Create PERSP/ORTHO camera |
| `set_camera_position` | Position and orient camera |
| `frame_object` | Auto-frame to fit object |
| `reset_viewport` | Reset to home view |
| `set_viewport_shading` | WIREFRAME/SOLID/MATERIAL/RENDERED |
| `set_viewport_view` | FRONT/BACK/TOP/BOTTOM/LEFT/RIGHT |

### Lighting
| Skill | Description |
|-------|-------------|
| `create_light` | Create POINT/SUN/SPOT/AREA light |
| `set_light_property` | Adjust energy, color, size |
| `set_world_color` | Set background color |
| `set_render_engine` | CYCLES/EEVEE/WORKBENCH |
| `configure_render` | Resolution, samples, denoising |
| `render_image` | Render to file |

### Rendering (Compound)
| Skill | Description |
|-------|-------------|
| `render_product_views` | Render 14 standard views (6 ortho + 8 persp) |

### Skill Statistics
| Skill | Description |
|-------|-------------|
| `get_skill_statistics` | Get call counts and timing |
| `get_skill_call_graph` | View compound skill relationships |
| `reset_skill_statistics` | Clear statistics |

## Usage

1. Start Blender and ensure the extension is enabled
2. The extension starts a TCP server on port 9876
3. Use MCP tools from your AI agent

Example conversation:
```
User: Create a red sphere at the origin
Agent: [calls create_object with type=sphere, then set_material with color=red]
```

## Development

```bash
# Install dev dependencies
uv sync --dev

# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov=src

# Deploy extension after changes
uv run python deploy_extension.py
# Then restart Blender to pick up changes

# Run MCP server directly
uv run blender-agent
```

## Project Structure

```
blender-agent/
├── src/
│   ├── blender_addon/       # Blender 5.0 extension
│   │   ├── __init__.py      # Extension entry point
│   │   ├── blender_manifest.toml
│   │   └── handlers/        # Skill implementations
│   │       ├── fundamentals.py
│   │       ├── modeling.py
│   │       ├── shading.py
│   │       ├── camera.py
│   │       ├── lighting.py
│   │       ├── rendering.py
│   │       ├── rigging.py
│   │       ├── uv.py
│   │       └── dynamic_skills.py
│   └── blender_agent/       # MCP server
│       ├── __init__.py
│       ├── server.py        # MCP protocol handler
│       └── blender_client.py
├── tests/                   # Test suite
├── models/                  # 3D model assets
├── goals/                   # Reference images
├── deploy_extension.py      # Extension deployment script
├── pyproject.toml
└── uv.lock
```

## License

MIT
