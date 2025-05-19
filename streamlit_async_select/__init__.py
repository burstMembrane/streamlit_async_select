import time
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components
from rapidfuzz import fuzz

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


def _set_defaults(key, default_results):
    st.session_state[key] = {
        "results": default_results,
        "key_react": f"{key}_react_{str(time.time())}",
    }


def _process_search(search_function, key, query):
    st.session_state[key]["results"] = search_function(query)


def async_select(
    key: str,
    results: list[dict],
    search_function: callable = None,
    default: str = "",
):
    if key not in st.session_state:
        _set_defaults(key, results)

    react_state = _component_func(
        results=st.session_state[key]["results"],
        key=st.session_state[key]["key_react"],
    )

    if react_state is None:
        return default

    interaction, value = react_state.get("interaction"), react_state.get("value")

    if interaction == "search" and search_function is not None:
        _process_search(search_function, key, value)
        st.rerun()

    if interaction == "submit":
        return value

    return default


def search_results(query: str):
    print("searching for", query)

    def score(result):
        title_score = fuzz.partial_ratio(query, result["title"])
        artist_score = fuzz.partial_ratio(query, result["description"])
        album_score = 0  # No album field in new results, so set to 0
        return max(title_score, artist_score, album_score)

    return sorted(
        [result for result in results if score(result) > 30],
        key=score,
        reverse=True,
    )


results = [
    {
        "id": "1",
        "title": "Bohemian Rhapsody",
        "artist": "Queen",
        "album": "A Night at the Opera",
        "releaseYear": 1975,
        "coverImage": "https://upload.wikimedia.org/wikipedia/en/9/9f/Bohemian_Rhapsody.png",
    },
    {
        "id": "2",
        "title": "Imagine",
        "artist": "John Lennon",
        "album": "Imagine",
        "releaseYear": 1971,
        "coverImage": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/John_Lennon_Imagine_1971.jpg/640px-John_Lennon_Imagine_1971.jpg",
    },
    {
        "id": "3",
        "title": "Billie Jean",
        "artist": "Michael Jackson",
        "album": "Thriller",
        "releaseYear": 1982,
        "coverImage": "https://t2.genius.com/unsafe/300x300/https%3A%2F%2Fimages.genius.com%2F9d06855287d0a499835ca1453317d6ec.1000x1000x1.jpg",
    },
    {
        "id": "4",
        "title": "Like a Rolling Stone",
        "artist": "Bob Dylan",
        "album": "Highway 61 Revisited",
        "releaseYear": 1965,
        "coverImage": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimg.discogs.com%2Fjd7vBzdcX0Sa1qS7MeD1xktyeYo%3D%2Ffit-in%2F600x600%2Ffilters%3Astrip_icc()%3Aformat(jpeg)%3Amode_rgb()%3Aquality(90)%2Fdiscogs-images%2FR-2932006-1370464524-6928.jpeg.jpg&f=1&nofb=1&ipt=ff4d4043369302c17020a683a2dbb05233f932d612a481cd283f21c407a61a3b",
    },
    {
        "id": "5",
        "title": "Smells Like Teen Spirit",
        "artist": "Nirvana",
        "album": "Nevermind",
        "releaseYear": 1991,
        "coverImage": "https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg",
    },
]


results = [
    {
        "id": result["id"],
        "title": result["title"],
        "description": result["artist"]
        + " - "
        + result["album"]
        + " ("
        + str(result["releaseYear"])
        + ")",
        "image": result["coverImage"],
    }
    for result in results
]


if not _RELEASE:
    import streamlit as st

    if "selected" not in st.session_state:
        st.session_state["selected"] = None

    st.subheader("async_select")
    selected = async_select(
        key="async_select",
        results=results,
        search_function=search_results,
    )

    if selected:
        st.write("Selected:", selected)
        st.session_state["selected"] = selected
