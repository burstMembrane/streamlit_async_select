from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

_RELEASE = False
if not _RELEASE:
    _component_func = components.declare_component(
        "async_select",
        url="http://localhost:5173",
    )
else:
    parent_dir = Path(__file__).parent
    build_dir = parent_dir / "frontend" / "dist"
    if not build_dir.exists():
        raise FileNotFoundError(f"Build directory not found: {build_dir}")
    _component_func = components.declare_component(
        "async_select", path=build_dir
    )


def async_select(
    name: str,
    key: str = None,
  
):
    """
    A async select component for streamlit
    """
    component_value = _component_func(
        name=name,
        key=key,
    )
    return component_value


if not _RELEASE:
    import streamlit as st

    st.subheader("async_select")
    async_select("async_select", key="async_select")