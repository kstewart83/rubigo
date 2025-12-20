# Rubigo

Enterprise Resource Management simulation platform with React and Rust implementations.

## Project Structure

```
rubigo/
├── common/              # Shared data across implementations
│   ├── scenarios/       # Profile configurations (SQL)
│   ├── schemas/         # JSON Schema definitions
│   └── geo/             # Geographic data (GeoJSON, CSV)
├── rubigo-react/        # Next.js frontend implementation
├── rubigo-leptos/       # Rust/Leptos full-stack implementation
└── blender-agent/       # 3D asset generation tools
```

## Scenario Profiles

Demo company profiles are stored in `common/scenarios/` as SQL files:

```
common/scenarios/
├── schema/           # Shared table definitions
├── profiles/         # Profile-specific data
│   └── mmc/          # Midwest Manufacturing Co.
│       ├── profile.sql
│       ├── data.sql
│       └── headshots/
└── builds/
    └── profiles.sqlite   # Compiled database (gitignored)
```

### Building the Database

```bash
cd rubigo-react
bun run scenarios:build
```

This compiles all profiles into `common/scenarios/builds/profiles.sqlite`.

### Loading Profile Data

```typescript
import { loadScenarioData } from "./scripts/scenario-loader";

const data = loadScenarioData("../common/scenarios", "mmc");
// data.personnel, data.calendarEvents, data.chatChannels, etc.
```

## Quick Start

### React (Next.js)

```bash
cd rubigo-react
bun install
bun run scenarios:build  # Build profile database
bun run dev
```

### Leptos (Rust)

```bash
cd rubigo-leptos
./dev.sh
```

## License

Proprietary - All rights reserved.
