# Rubigo

Enterprise Resource Management simulation platform with React and Rust implementations.

## Project Structure

```
rubigo/
├── common/              # Shared data across implementations
│   ├── scenarios/       # Scenario configurations (TOML)
│   ├── schemas/         # JSON Schema definitions
│   └── geo/             # Geographic data (GeoJSON, CSV)
├── rubigo-react/        # Next.js frontend implementation
├── rubigo-leptos/       # Rust/Leptos full-stack implementation
└── blender-agent/       # 3D asset generation tools
```

## Common Data

Shared resources used by both frontend implementations:

### Scenarios (`common/scenarios/`)

TOML-based configuration for simulated organizations:

| File | Purpose |
|------|---------|
| `scenario.toml` | Organization metadata |
| `sites.toml` | Regions, buildings, floors, spaces |
| `personnel.toml` | Employee directory |
| `assets.toml` | Network infrastructure inventory |
| `events.toml` | Calendar meetings |

### Schemas (`common/schemas/`)

JSON Schema definitions for data validation:

- `site.schema.json` - Geographic hierarchy
- `personnel.schema.json` - Employee records  
- `asset.schema.json` - Network assets
- `calendar.schema.json` - Calendar events

### Geographic Data (`common/geo/`)

| File | Size | Description |
|------|------|-------------|
| `countries_110m.geo.json` | 1MB | Low-res country boundaries |
| `countries_10m.geo.json` | 22MB | High-res country boundaries |
| `us_states_20m.geo.json` | 1.4MB | Low-res US states |
| `us_states_5m.geo.json` | 2.5MB | High-res US states |
| `worldcities.csv` | 5MB | ~48K cities worldwide |
| `worldcities_dev.csv` | 11KB | ~120 cities (dev subset) |

## Quick Start

### Leptos (Rust)

```bash
cd rubigo-leptos
./dev.sh
```

### React (Next.js)

```bash
cd rubigo-react
bun install
bun run dev
```

## License

Proprietary - All rights reserved.
