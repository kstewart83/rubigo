#!/usr/bin/env python3
"""Deploy the Blender Agent extension directly to Blender's local repository.

This script copies the extension files to Blender's user_default repository,
enabling hot-reload during development without needing to reinstall.
"""

import os
import shutil
import sys
from pathlib import Path

# Blender 5.0 extensions path on macOS
# Adjust BLENDER_VERSION if needed
BLENDER_VERSION = "5.0"
USER = os.environ.get("USER", "kyle")

# Platform-specific paths
if sys.platform == "darwin":  # macOS
    BLENDER_EXTENSIONS_BASE = Path(f"/Users/{USER}/Library/Application Support/Blender/{BLENDER_VERSION}/extensions")
elif sys.platform == "win32":  # Windows
    BLENDER_EXTENSIONS_BASE = Path(os.environ.get("APPDATA", "")) / "Blender Foundation" / "Blender" / BLENDER_VERSION / "extensions"
else:  # Linux
    BLENDER_EXTENSIONS_BASE = Path.home() / ".config" / "blender" / BLENDER_VERSION / "extensions"


def get_project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent


def bump_version() -> str:
    """Bump the patch version in blender_manifest.toml and return new version."""
    manifest_path = get_project_root() / "src" / "blender_addon" / "blender_manifest.toml"
    
    if not manifest_path.exists():
        print("Error: blender_manifest.toml not found")
        return "unknown"
    
    content = manifest_path.read_text()
    lines = content.split('\n')
    new_lines = []
    new_version = "unknown"
    
    for line in lines:
        if line.startswith('version = '):
            # Parse current version
            current = line.split('"')[1]  # e.g., "0.1.5" -> 0.1.5
            parts = current.split('.')
            if len(parts) == 3:
                major, minor, patch = parts
                new_patch = int(patch) + 1
                new_version = f"{major}.{minor}.{new_patch}"
                new_lines.append(f'version = "{new_version}"')
                print(f"Version: {current} → {new_version}")
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    manifest_path.write_text('\n'.join(new_lines))
    return new_version


def deploy_extension():
    """Deploy the extension to Blender's local repository."""
    project_root = get_project_root()
    addon_source = project_root / "src" / "blender_addon"
    
    if not addon_source.exists():
        print(f"Error: Source directory not found: {addon_source}")
        return False
    
    # Bump version first
    new_version = bump_version()
    print()
    
    # Target: user_default repository with extension id as folder name
    extension_id = "blender_agent"
    user_default_repo = BLENDER_EXTENSIONS_BASE / "user_default"
    target_dir = user_default_repo / extension_id
    
    print(f"Blender extensions base: {BLENDER_EXTENSIONS_BASE}")
    print(f"Source: {addon_source}")
    print(f"Target: {target_dir}")
    print()
    
    # Create user_default repository if it doesn't exist
    user_default_repo.mkdir(parents=True, exist_ok=True)
    
    # Remove existing installation
    if target_dir.exists():
        print(f"Removing existing installation...")
        shutil.rmtree(target_dir)
    
    # Copy extension files
    print(f"Copying extension files...")
    shutil.copytree(addon_source, target_dir)
    
    print()
    print(f"✓ Extension v{new_version} deployed successfully!")
    print(f"  Location: {target_dir}")
    print()
    print("Next steps:")
    print("  1. Restart Blender (if it's open)")
    print("  2. Go to Edit → Preferences → Get Extensions")
    print("  3. Enable 'Blender Agent Socket Server' under 'User Default' repository")
    
    return True


def watch_and_deploy():
    """Watch for changes and auto-deploy (requires watchdog)."""
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        print("Error: watchdog not installed. Run: pip install watchdog")
        return
    
    class ChangeHandler(FileSystemEventHandler):
        def on_any_event(self, event):
            if event.src_path.endswith('.py') or event.src_path.endswith('.toml'):
                print(f"\nChange detected: {event.src_path}")
                deploy_extension()
    
    project_root = get_project_root()
    addon_source = project_root / "src" / "blender_addon"
    
    print(f"Watching for changes in: {addon_source}")
    print("Press Ctrl+C to stop\n")
    
    deploy_extension()
    
    observer = Observer()
    observer.schedule(ChangeHandler(), str(addon_source), recursive=True)
    observer.start()
    
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "watch":
        watch_and_deploy()
    else:
        deploy_extension()
