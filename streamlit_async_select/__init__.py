import datetime
import time
from pathlib import Path
from typing import Any, Callable, List, Literal

import numpy as np
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components
from rapidfuzz import fuzz, process, utils
from streamlit import rerun
from streamlit_extras.stylable_container import stylable_container

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
    _component_func = components.declare_component("async_select", path=build_dir)


def _set_defaults(
    key: str,
    default: Any,
    default_searchterm: str = "",
    default_options: List[Any] | None = None,
) -> None:
    st.session_state[key] = {
        # updated after each selection / reset
        "result": default,
        # updated after each search keystroke
        "search": default_searchterm,
        # updated after each search_function run
        "options_js": [],
        # key that is used by react component, use time suffix to reload after clear
        "key_react": f"{key}_react_{str(time.time())}",
    }

    if default_options:
        st.session_state[key]["options_js"] = default_options
        st.session_state[key]["options_py"] = default_options


@st.cache_data
def load_track_data():
    df = pd.read_csv(
        Path(__file__).parent / "data" / "track_info_filtered.csv",
        usecols=["track_id", "title", "artist", "album", "release_year", "cover"],
    )
    return df


def _rerun(rerun_scope: Literal["app", "fragment"]) -> None:
    # only pass scope if the version is >= 1.37
    if st.__version__ >= "1.37":
        rerun(scope=rerun_scope)  # type: ignore
    else:
        rerun()


def _list_to_options_py(options: list[Any] | list[tuple[str, Any]]) -> list[Any]:
    """
    unpack search options for proper python return types
    """
    return options


def _list_to_options_js(
    options: list[Any] | list[tuple[str, Any]],
) -> list[dict[str, Any]]:
    """
    unpack search options for use in react component
    """
    return options


def _process_search(
    search_function: Callable[[str], List[Any]],
    key: str,
    searchterm: str,
    rerun_on_update: bool,
    rerun_scope: Literal["app", "fragment"] = "app",
    min_execution_time: int = 0,
    **kwargs,
) -> None:
    # nothing changed, avoid new search
    if searchterm == st.session_state[key]["search"]:
        return

    st.session_state[key]["search"] = searchterm

    ts_start = datetime.datetime.now()

    search_results = search_function(searchterm, **kwargs)

    if search_results is None:
        search_results = []

    st.session_state[key]["options_js"] = search_results
    st.session_state[key]["options_py"] = search_results

    if rerun_on_update:
        ts_stop = datetime.datetime.now()
        execution_time_ms = (ts_stop - ts_start).total_seconds() * 1000

        # wait until minimal execution time is reached
        if execution_time_ms < min_execution_time:
            time.sleep((min_execution_time - execution_time_ms) / 1000)

        _rerun(rerun_scope)


def async_select(
    key: str,
    search_function: Callable[[str], List[Any]] = None,
    style_absolute: bool = True,
    rerun_on_update: bool = True,
    rerun_scope: Literal["app", "fragment"] = "app",
    min_execution_time: int = 0,
    submit_function: Callable[[Any], None] = None,
    clear_on_submit: bool = False,
    default_searchterm: str = "",
    default_use_searchterm: bool = False,
    default_options: List[Any] | None = None,
    default: Any = None,
    reset_function: Callable[[], None] | None = None,
    **kwargs,
):
    if key not in st.session_state:
        _set_defaults(
            key,
            default,
            default_searchterm,
            default_options,
        )
    if "results" not in st.session_state[key]:
        st.session_state[key]["results"] = results
    # everything here is passed to react as this.props.args
    container = stylable_container(
        key=f"overlay_{key}",
        css_styles="""
    {{
        background-color: transparent;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999992;
        display: "flex";
    }}
    """,
    )

    if style_absolute:
        # add empty markdown blocks to reserve space for the iframe
        st.markdown("")
        st.markdown("")

        css = """
        iframe[title="__init__.async_select"] {
            position: absolute;
            z-index: 999992;
        }
        """
        st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)
    with container:
        react_state = _component_func(
            results=st.session_state[key]["options_py"],
            key=st.session_state[key]["key_react"],
        )

    if react_state is None:
        return st.session_state[key]["result"]

    interaction, value = react_state["interaction"], react_state["value"]

    if interaction == "search":
        # triggers rerun, no ops afterwards executed
        _process_search(
            search_function,
            key,
            value,
            rerun_on_update,
            rerun_scope=rerun_scope,
            min_execution_time=min_execution_time,
            **kwargs,
        )

    if interaction == "submit":
        submit_value = value

        # ensure submit_function only runs when value changed
        if st.session_state[key]["result"] != submit_value:
            st.session_state[key]["result"] = submit_value
            if submit_function is not None:
                submit_function(submit_value)

        if clear_on_submit:
            _set_defaults(
                key,
                st.session_state[key]["result"],
                default_searchterm,
                default_options,
            )
            _rerun(rerun_scope)

        return st.session_state[key]["result"]

    if interaction == "reset":
        _set_defaults(
            key,
            default,
            default_searchterm,
            default_options,
        )

        if reset_function is not None:
            reset_function()

        if rerun_on_update:
            _rerun(rerun_scope)

        return default

    # no new react interaction happened
    return st.session_state[key]["result"]


if "track_data" not in st.session_state:
    df = load_track_data()
    # convert to id, title, description, image
    results = [
        {
            "id": row["track_id"],
            "title": row["title"],
            "description": f"{row['artist']} ({int(row['release_year'])})",
            "image": row["cover"],
        }
        for _, row in df.iterrows()
    ]
    results = pd.DataFrame(results)
    _choices = (df["title"] + " - " + df["artist"]).tolist()
    st.session_state["track_data"] = results
    st.session_state["choices"] = _choices
    st.session_state["search_titles"] = df["title"].tolist()
    st.session_state["search_artists"] = df["artist"].tolist()


def search_results(query: str) -> list[dict]:
    if len(query) < 3:
        return []
    df = st.session_state["track_data"]
    titles = st.session_state["search_titles"]
    artists = st.session_state["search_artists"]
    # # compute distance arrays for titles and artists
    distances_titles = process.cdist(
        [query],
        titles,
        scorer=fuzz.partial_ratio,
        processor=utils.default_process,
        workers=-1,
    )[0]
    distances_artists = process.cdist(
        [query],
        artists,
        scorer=fuzz.partial_ratio,
        processor=utils.default_process,
        workers=-1,
    )[0]
    # combine distances and filter by threshold
    distances = np.maximum(distances_titles, distances_artists)
    indices = np.where(distances >= 30)[0]
    # naive search based on title and artist
    subset = df.iloc[indices]
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "image": row["image"],
        }
        for _, row in subset.iterrows()
    ]


def run_search():
    selected = async_select(
        key="async-select",
        search_function=search_results,
        default_options=st.session_state["track_data"].to_dict(orient="records")[:5],
        rerun_on_update=False,
    )
    st.markdown(f"### Selected: {selected}")
    return


if not _RELEASE:
    import streamlit as st

    if "app_reruns" not in st.session_state:
        st.session_state["app_reruns"] = 0
    if "fragment_reruns" not in st.session_state:
        st.session_state["fragment_reruns"] = 0
    selected = run_search()
    st.session_state["app_reruns"] += 1
    st.write(f"App reruns: {st.session_state['app_reruns']}")
