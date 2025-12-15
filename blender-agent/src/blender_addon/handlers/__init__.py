"""Handler modules for Blender Agent.

Each module contains handlers for a specific category of skills.
"""

from . import fundamentals
from . import modeling
from . import uv
from . import rigging
from . import shading
from . import lighting
from . import camera
from . import rendering
from . import dynamic_skills


def get_handler_map() -> dict:
    """Get reference to handler map from main module.
    
    This is set by the main __init__.py during registration.
    """
    from .. import _handler_map
    return _handler_map


def call_handler(name: str, params: dict, caller: str = None) -> dict:
    """Call a handler by name with optional call tracking.
    
    Use this from compound skills to ensure statistics are tracked.
    
    Args:
        name: Handler name
        params: Parameters to pass
        caller: Name of calling handler (for indirect call tracking)
    
    Returns:
        Handler result dict
    """
    import time
    
    handler_map = get_handler_map()
    handler = handler_map.get(name)
    if not handler:
        raise ValueError(f"Handler not found: {name}")
    
    start_time = time.time()
    result = handler(params)
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    # Track the call as indirect if caller is specified
    if caller:
        dynamic_skills.track_indirect_handler_call(name, caller, elapsed_ms)
    
    return result
