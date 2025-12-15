---
description: How to develop UI while Claude edits code concurrently
---

# Concurrent UI Development Workflow

## Overview

This workflow allows you to run the development server (`refactor.sh`) while Claude edits code. Changes auto-reload in the browser without cargo lock conflicts.

## Architecture

```
┌─────────────────┐          ┌─────────────────┐
│  YOUR TERMINAL  │          │     CLAUDE      │
│  ./refactor.sh  │          │  (editing code) │
└────────┬────────┘          └────────┬────────┘
         │                            │
         ▼                            ▼
┌─────────────────┐          ┌─────────────────┐
│ Trunk (watcher) │          │  cargo build    │
│ target-trunk/   │          │  target/        │
└────────┬────────┘          └─────────────────┘
         │
         ▼ (WebSocket hot reload)
┌─────────────────┐
│    Browser      │
└─────────────────┘
```

## How It Works

1. **Separate target directories**: Trunk uses `target-trunk/`, manual cargo uses `target/`
2. **No lock conflicts**: Each process has its own build cache
3. **Auto-reload**: When Claude saves a file, Trunk detects it and rebuilds
4. **Debounced**: 500ms debounce prevents rapid rebuilds during multi-file edits

## Running

```bash
# Terminal 1: Start the dev server
./refactor.sh

# Claude can now edit files freely - the browser will auto-reload
```

## Notes for Claude

// turbo-all
When editing ui-core or ui-app files:
1. Save all related files before requesting review
2. Avoid running `cargo build -p ui-app` while refactor.sh is running
3. Unit tests (`cargo test -p ui-core`) use `target/` and won't conflict
4. If you need to verify a build, check the Trunk terminal output instead
