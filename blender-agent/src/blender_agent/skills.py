"""Skills database for the Blender Agent.

Manages a SQLite database of skills aligned with the Blender Fundamentals course.
Each skill can be executed via the Blender socket server.
"""

import json
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any


# Database location (project directory for version control)
DB_PATH = Path(__file__).parent.parent.parent / "skills.db"


@dataclass
class Skill:
    """Represents a Blender skill."""
    name: str
    category: str
    chapter: int
    description: str
    parameters_schema: dict = field(default_factory=dict)
    code: str | None = None
    id: int | None = None
    usage_count: int = 0
    verified: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SkillsDB:
    """SQLite database manager for Blender skills."""
    
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self) -> None:
        """Initialize the database schema."""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    category TEXT NOT NULL,
                    chapter INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    code TEXT,
                    parameters_schema TEXT DEFAULT '{}',
                    usage_count INTEGER DEFAULT 0,
                    verified INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS skill_dependencies (
                    parent_skill_id INTEGER NOT NULL,
                    child_skill_id INTEGER NOT NULL,
                    execution_order INTEGER NOT NULL,
                    PRIMARY KEY (parent_skill_id, child_skill_id),
                    FOREIGN KEY (parent_skill_id) REFERENCES skills(id),
                    FOREIGN KEY (child_skill_id) REFERENCES skills(id)
                );
                
                CREATE TABLE IF NOT EXISTS skill_executions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    skill_id INTEGER NOT NULL,
                    parameters TEXT,
                    result TEXT,
                    success INTEGER NOT NULL,
                    duration_ms INTEGER,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (skill_id) REFERENCES skills(id)
                );
                
                CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
                CREATE INDEX IF NOT EXISTS idx_skills_chapter ON skills(chapter);
                CREATE INDEX IF NOT EXISTS idx_executions_skill ON skill_executions(skill_id);
            """)
    
    def add_skill(self, skill: Skill) -> int:
        """Add a new skill to the database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                INSERT INTO skills (name, category, chapter, description, code, parameters_schema, verified)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                skill.name,
                skill.category,
                skill.chapter,
                skill.description,
                skill.code,
                json.dumps(skill.parameters_schema),
                1 if skill.verified else 0,
            ))
            return cursor.lastrowid
    
    def get_skill(self, name: str) -> Skill | None:
        """Get a skill by name."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT * FROM skills WHERE name = ?", (name,)
            ).fetchone()
            
            if row:
                return self._row_to_skill(row)
            return None
    
    def get_skill_by_id(self, skill_id: int) -> Skill | None:
        """Get a skill by ID."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT * FROM skills WHERE id = ?", (skill_id,)
            ).fetchone()
            
            if row:
                return self._row_to_skill(row)
            return None
    
    def list_skills(self, category: str | None = None, chapter: int | None = None) -> list[Skill]:
        """List skills, optionally filtered by category or chapter."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            query = "SELECT * FROM skills WHERE 1=1"
            params = []
            
            if category:
                query += " AND category = ?"
                params.append(category)
            if chapter is not None:
                query += " AND chapter = ?"
                params.append(chapter)
            
            query += " ORDER BY chapter, name"
            rows = conn.execute(query, params).fetchall()
            return [self._row_to_skill(row) for row in rows]
    
    def update_skill(self, skill: Skill) -> None:
        """Update an existing skill."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE skills SET
                    category = ?,
                    chapter = ?,
                    description = ?,
                    code = ?,
                    parameters_schema = ?,
                    verified = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE name = ?
            """, (
                skill.category,
                skill.chapter,
                skill.description,
                skill.code,
                json.dumps(skill.parameters_schema),
                1 if skill.verified else 0,
                skill.name,
            ))
    
    def mark_verified(self, name: str, verified: bool = True) -> None:
        """Mark a skill as verified (tested and working)."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "UPDATE skills SET verified = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?",
                (1 if verified else 0, name)
            )
    
    def increment_usage(self, name: str) -> None:
        """Increment the usage count for a skill."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "UPDATE skills SET usage_count = usage_count + 1 WHERE name = ?",
                (name,)
            )
    
    def log_execution(
        self,
        skill_id: int,
        parameters: dict,
        result: Any,
        success: bool,
        duration_ms: int,
    ) -> None:
        """Log a skill execution."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO skill_executions (skill_id, parameters, result, success, duration_ms)
                VALUES (?, ?, ?, ?, ?)
            """, (
                skill_id,
                json.dumps(parameters),
                json.dumps(result) if result else None,
                1 if success else 0,
                duration_ms,
            ))
    
    def add_dependency(self, parent_name: str, child_name: str, order: int) -> None:
        """Add a dependency between skills."""
        parent = self.get_skill(parent_name)
        child = self.get_skill(child_name)
        
        if not parent or not child:
            raise ValueError(f"Skills not found: {parent_name} or {child_name}")
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO skill_dependencies (parent_skill_id, child_skill_id, execution_order)
                VALUES (?, ?, ?)
            """, (parent.id, child.id, order))
    
    def get_dependencies(self, name: str) -> list[Skill]:
        """Get all dependencies for a skill (in execution order)."""
        skill = self.get_skill(name)
        if not skill:
            return []
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("""
                SELECT s.* FROM skills s
                JOIN skill_dependencies d ON s.id = d.child_skill_id
                WHERE d.parent_skill_id = ?
                ORDER BY d.execution_order
            """, (skill.id,)).fetchall()
            
            return [self._row_to_skill(row) for row in rows]
    
    def _row_to_skill(self, row: sqlite3.Row) -> Skill:
        """Convert a database row to a Skill object."""
        return Skill(
            id=row["id"],
            name=row["name"],
            category=row["category"],
            chapter=row["chapter"],
            description=row["description"],
            code=row["code"],
            parameters_schema=json.loads(row["parameters_schema"] or "{}"),
            usage_count=row["usage_count"],
            verified=bool(row["verified"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
    
    def get_stats(self) -> dict:
        """Get database statistics."""
        with sqlite3.connect(self.db_path) as conn:
            total = conn.execute("SELECT COUNT(*) FROM skills").fetchone()[0]
            verified = conn.execute("SELECT COUNT(*) FROM skills WHERE verified = 1").fetchone()[0]
            by_chapter = conn.execute("""
                SELECT chapter, COUNT(*) FROM skills GROUP BY chapter ORDER BY chapter
            """).fetchall()
            
            return {
                "total_skills": total,
                "verified_skills": verified,
                "by_chapter": {ch: count for ch, count in by_chapter},
            }


# Convenience function to get shared database instance
_db: SkillsDB | None = None

def get_db() -> SkillsDB:
    """Get the shared skills database instance."""
    global _db
    if _db is None:
        _db = SkillsDB()
    return _db
