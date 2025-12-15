"""Dynamic skills - runtime skill registration and management.

Provides ability to register, list, and execute skills at runtime
without requiring extension reboot.
"""

import bpy
import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Callable


def get_db_path() -> Path:
    """Get path to dynamic skills database in extension folder."""
    extension_path = Path(__file__).parent.parent
    return extension_path / "dynamic_skills.db"


def init_db():
    """Initialize the dynamic skills database."""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Dynamic skills table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dynamic_skills (
            name TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            parameters TEXT,
            code TEXT NOT NULL,
            version TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            call_count INTEGER DEFAULT 0
        )
    """)
    
    # Unified skill statistics (core + dynamic)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skill_statistics (
            name TEXT PRIMARY KEY,
            is_core BOOLEAN DEFAULT FALSE,
            direct_calls INTEGER DEFAULT 0,
            indirect_calls INTEGER DEFAULT 0,
            last_called TIMESTAMP,
            total_time_ms INTEGER DEFAULT 0
        )
    """)
    
    # Call graph tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skill_call_graph (
            caller TEXT,
            callee TEXT,
            call_count INTEGER DEFAULT 0,
            PRIMARY KEY (caller, callee)
        )
    """)
    
    conn.commit()
    conn.close()



def get_dynamic_skill(name: str) -> dict | None:
    """Get a dynamic skill by name."""
    db_path = get_db_path()
    if not db_path.exists():
        return None
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name, category, description, parameters, code, version FROM dynamic_skills WHERE name = ?",
        (name,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "name": row[0],
            "category": row[1],
            "description": row[2],
            "parameters": json.loads(row[3]) if row[3] else {},
            "code": row[4],
            "version": row[5],
        }
    return None


def execute_dynamic_skill(skill: dict, params: dict, caller: str = None) -> dict:
    """Execute a dynamic skill's code with given parameters.
    
    Args:
        skill: The skill definition dict
        params: Parameters to pass to the skill
        caller: Name of calling skill (None = direct MCP call)
    """
    code = skill["code"]
    skill_name = skill["name"]
    start_time = time.time()
    
    # Create execution namespace with available modules
    namespace = {
        "bpy": bpy,
        "math": __import__("math"),
        "mathutils": __import__("mathutils"),
        "Vector": __import__("mathutils").Vector,
        "params": params,
        "result": None,
    }
    
    # Execute the code
    exec(code, namespace)
    
    # Get result
    result = namespace.get("result")
    if result is None:
        result = {"success": True}
    
    # Calculate execution time
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    # Update statistics
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Legacy: update call_count in dynamic_skills table
    cursor.execute(
        "UPDATE dynamic_skills SET call_count = call_count + 1 WHERE name = ?",
        (skill_name,)
    )
    
    # New: update skill_statistics
    is_direct = caller is None
    cursor.execute("""
        INSERT INTO skill_statistics (name, is_core, direct_calls, indirect_calls, last_called, total_time_ms)
        VALUES (?, FALSE, ?, ?, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(name) DO UPDATE SET
            direct_calls = direct_calls + ?,
            indirect_calls = indirect_calls + ?,
            last_called = CURRENT_TIMESTAMP,
            total_time_ms = total_time_ms + ?
    """, (
        skill_name,
        1 if is_direct else 0,
        0 if is_direct else 1,
        elapsed_ms,
        1 if is_direct else 0,
        0 if is_direct else 1,
        elapsed_ms
    ))
    
    # Update call graph if there's a caller
    if caller:
        cursor.execute("""
            INSERT INTO skill_call_graph (caller, callee, call_count)
            VALUES (?, ?, 1)
            ON CONFLICT(caller, callee) DO UPDATE SET
                call_count = call_count + 1
        """, (caller, skill_name))
    
    conn.commit()
    conn.close()
    
    return result



def get_all_dynamic_skills() -> list[dict]:
    """Get all registered dynamic skills."""
    db_path = get_db_path()
    if not db_path.exists():
        return []
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name, category, description, parameters, version, call_count FROM dynamic_skills"
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "name": row[0],
            "category": row[1],
            "description": row[2],
            "parameters": json.loads(row[3]) if row[3] else {},
            "version": row[4],
            "call_count": row[5],
            "is_dynamic": True,
        }
        for row in rows
    ]


# --- Handlers ---

def handle_register_skill(params: dict) -> dict:
    """Register a new dynamic skill.
    
    Category: primitive
    
    Parameters:
        name: Skill name (must be unique)
        category: simple|standard|inspect|primitive
        description: Human-readable description for MCP
        parameters: Dict of parameter definitions
        code: Python code to execute (must set 'result' variable)
        version: Semantic version string
    """
    name = params.get("name")
    category = params.get("category", "standard")
    description = params.get("description", "")
    skill_params = params.get("parameters", {})
    code = params.get("code")
    version = params.get("version", "1.0.0")
    
    if not name:
        raise ValueError("Skill name is required")
    if not code:
        raise ValueError("Skill code is required")
    if category not in ("simple", "standard", "inspect", "primitive"):
        raise ValueError(f"Invalid category: {category}")
    
    # Initialize DB if needed
    init_db()
    
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO dynamic_skills 
        (name, category, description, parameters, code, version, call_count)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE(
            (SELECT call_count FROM dynamic_skills WHERE name = ?), 0
        ))
    """, (name, category, description, json.dumps(skill_params), code, version, name))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "name": name,
        "category": category,
        "version": version,
        "message": f"Skill '{name}' registered",
    }


def handle_list_skills(params: dict) -> dict:
    """List all available skills with metadata.
    
    Category: inspect
    
    Parameters:
        category: Optional category filter
        include_code: Include code in response (default False)
    """
    category_filter = params.get("category")
    include_code = params.get("include_code", False)
    
    # Get core skills from handler map
    from . import get_handler_map
    core_handlers = get_handler_map()
    
    skills = []
    
    # Add core skills
    for name in core_handlers.keys():
        skill_info = {
            "name": name,
            "is_dynamic": False,
        }
        # TODO: Add category metadata to core skills
        skills.append(skill_info)
    
    # Add dynamic skills
    for skill in get_all_dynamic_skills():
        if category_filter and skill["category"] != category_filter:
            continue
        skill_info = {
            "name": skill["name"],
            "category": skill["category"],
            "description": skill["description"],
            "version": skill["version"],
            "call_count": skill["call_count"],
            "is_dynamic": True,
        }
        if include_code:
            full_skill = get_dynamic_skill(skill["name"])
            if full_skill:
                skill_info["code"] = full_skill["code"]
        skills.append(skill_info)
    
    return {
        "success": True,
        "count": len(skills),
        "skills": skills,
    }


def handle_unregister_skill(params: dict) -> dict:
    """Remove a dynamic skill.
    
    Category: primitive
    
    Parameters:
        name: Skill name to remove
    """
    name = params.get("name")
    
    if not name:
        raise ValueError("Skill name is required")
    
    db_path = get_db_path()
    if not db_path.exists():
        raise ValueError(f"Skill not found: {name}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM dynamic_skills WHERE name = ?", (name,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    if not deleted:
        raise ValueError(f"Skill not found: {name}")
    
    return {
        "success": True,
        "name": name,
        "message": f"Skill '{name}' unregistered",
    }


def handle_get_skill_statistics(params: dict) -> dict:
    """Get statistics for all skills (core + dynamic).
    
    Category: inspect
    
    Parameters:
        name: Optional skill name to filter
    """
    init_db()
    name_filter = params.get("name")
    
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    if name_filter:
        cursor.execute("""
            SELECT name, is_core, direct_calls, indirect_calls, last_called, total_time_ms
            FROM skill_statistics WHERE name = ?
        """, (name_filter,))
    else:
        cursor.execute("""
            SELECT name, is_core, direct_calls, indirect_calls, last_called, total_time_ms
            FROM skill_statistics ORDER BY (direct_calls + indirect_calls) DESC
        """)
    
    rows = cursor.fetchall()
    conn.close()
    
    stats = [
        {
            "name": row[0],
            "is_core": bool(row[1]),
            "direct_calls": row[2],
            "indirect_calls": row[3],
            "total_calls": row[2] + row[3],
            "last_called": row[4],
            "total_time_ms": row[5],
        }
        for row in rows
    ]
    
    return {
        "success": True,
        "count": len(stats),
        "statistics": stats,
    }


def handle_get_call_graph(params: dict) -> dict:
    """Get the skill call graph.
    
    Category: inspect
    
    Parameters:
        caller: Optional filter by caller
        callee: Optional filter by callee
    """
    init_db()
    caller_filter = params.get("caller")
    callee_filter = params.get("callee")
    
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = "SELECT caller, callee, call_count FROM skill_call_graph"
    conditions = []
    values = []
    
    if caller_filter:
        conditions.append("caller = ?")
        values.append(caller_filter)
    if callee_filter:
        conditions.append("callee = ?")
        values.append(callee_filter)
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY call_count DESC"
    
    cursor.execute(query, tuple(values))
    rows = cursor.fetchall()
    conn.close()
    
    edges = [
        {"caller": row[0], "callee": row[1], "call_count": row[2]}
        for row in rows
    ]
    
    return {
        "success": True,
        "count": len(edges),
        "edges": edges,
    }


def register_core_handlers(handler_names: list[str]):
    """Register core handlers in the statistics table.
    
    Called on extension load to ensure core handlers are tracked.
    """
    init_db()
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    for name in handler_names:
        cursor.execute("""
            INSERT OR IGNORE INTO skill_statistics (name, is_core, direct_calls, indirect_calls, total_time_ms)
            VALUES (?, TRUE, 0, 0, 0)
        """, (name,))
    
    conn.commit()
    conn.close()


def track_core_handler_call(name: str, elapsed_ms: int):
    """Track a call to a core handler.
    
    Called after each core handler execution.
    """
    init_db()
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO skill_statistics (name, is_core, direct_calls, indirect_calls, last_called, total_time_ms)
        VALUES (?, TRUE, 1, 0, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(name) DO UPDATE SET
            direct_calls = direct_calls + 1,
            last_called = CURRENT_TIMESTAMP,
            total_time_ms = total_time_ms + ?
    """, (name, elapsed_ms, elapsed_ms))
    
    conn.commit()
    conn.close()


def track_indirect_handler_call(name: str, caller: str, elapsed_ms: int):
    """Track an indirect call to a handler from a compound skill.
    
    Called by call_handler() when a handler calls another handler.
    
    Args:
        name: Name of the called handler
        caller: Name of the calling handler
        elapsed_ms: Execution time in milliseconds
    """
    init_db()
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Update skill_statistics with indirect call
    cursor.execute("""
        INSERT INTO skill_statistics (name, is_core, direct_calls, indirect_calls, last_called, total_time_ms)
        VALUES (?, TRUE, 0, 1, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(name) DO UPDATE SET
            indirect_calls = indirect_calls + 1,
            last_called = CURRENT_TIMESTAMP,
            total_time_ms = total_time_ms + ?
    """, (name, elapsed_ms, elapsed_ms))
    
    # Update call graph
    cursor.execute("""
        INSERT INTO skill_call_graph (caller, callee, call_count)
        VALUES (?, ?, 1)
        ON CONFLICT(caller, callee) DO UPDATE SET
            call_count = call_count + 1
    """, (caller, name))
    
    conn.commit()
    conn.close()
