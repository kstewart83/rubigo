#!/usr/bin/env python3
"""Test script for Blender window detection and repositioning."""

import pywinctl as pwc
import sys


def main():
    print("=== All windows ===")
    all_windows = pwc.getAllWindows()
    for w in all_windows:
        print(f'  "{w.title}"')
    
    print("\n=== Looking for Blender ===")
    blender_window = None
    for w in all_windows:
        if w.title and "Blender" in w.title:
            blender_window = w
            break
    
    if not blender_window:
        print("❌ Blender window not found")
        return 1
    
    print(f"✓ Found: \"{blender_window.title}\"")
    
    # Get current position
    try:
        print(f"\nCurrent position: ({blender_window.left}, {blender_window.top})")
        print(f"Current size: {blender_window.width}x{blender_window.height}")
    except Exception as e:
        print(f"Error getting position: {e}")
    
    # Try to reposition
    if len(sys.argv) >= 3:
        x = int(sys.argv[1])
        y = int(sys.argv[2])
        w = int(sys.argv[3]) if len(sys.argv) >= 4 else blender_window.width
        h = int(sys.argv[4]) if len(sys.argv) >= 5 else blender_window.height
        
        print(f"\nRepositioning to: ({x}, {y}) {w}x{h}")
        try:
            blender_window.moveTo(x, y)
            blender_window.resizeTo(w, h)
            print("✓ Repositioned")
        except Exception as e:
            print(f"❌ Error repositioning: {e}")
    else:
        print("\nUsage: python reposition.py <x> <y> [width] [height]")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
