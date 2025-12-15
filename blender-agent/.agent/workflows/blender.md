---
description: how to interact with Blender from this project
---

# Blender Interaction Workflow

When you need to interact with Blender (create objects, get scene info, render, etc.), **DO NOT use MCP tools**. Instead, use the Python client script.

## Deploying & Restarting Blender

When making changes to the Blender addon, use the restart script:

```bash
# Deploy and restart Blender (preserves window position)
// turbo
uv run python restart_blender.py --deploy

# Just verify extension is connected
// turbo
uv run python restart_blender.py --verify-only

# Restart without deploying
// turbo
uv run python restart_blender.py
```

## Executing Blender Commands

Use `mcp_client.py` for all Blender interactions:

```bash
python3 mcp_client.py <method> '<json params>'
```

## Available Methods

### Phase 1: First Steps
| Method | Description |
|--------|-------------|
| `ping` | Test connection |
| `get_version` | Get Blender version |
| `get_scene_info` | Get scene objects |
| `create_object` | Create primitive |
| `delete_object` | Delete object |
| `transform_object` | Move/rotate/scale |
| `set_viewport` | Set view angle |
| `save_file` | Save .blend file |

### Phase 2: Modeling
| Method | Description |
|--------|-------------|
| `set_mode` | OBJECT/EDIT mode |
| `select_mesh_elements` | Select all/none |
| `extrude` | Extrude geometry |
| `loop_cut` | Subdivide mesh |
| `bevel` | Bevel edges |
| `inset` | Inset faces |
| `add_modifier` | Add modifier |
| `apply_modifier` | Apply modifier |

// turbo-all
