import {
    Streamlit,
    withStreamlitConnection,
    ComponentProps,
} from "streamlit-component-lib"
import { useEffect, ReactElement, useState, useRef } from "react"
import { AsyncSelect as AsyncSelectComponent } from "./components/ui/async-select"
import { AspectRatio } from "./components/ui/aspect-ratio"
/**
* This is a React-based component template. The passed props are coming from the
* Streamlit library. Your custom args can be accessed via the `args` props.
* Place your custom logic here.
*/

type Track = {
    id: string
    title: string
    artist: string
    album: string
    releaseYear: number
    coverImage: string
}

const TRACKS: Track[] = [
    {
        id: "1",
        title: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        releaseYear: 1975,
        coverImage: "https://upload.wikimedia.org/wikipedia/en/9/9f/Bohemian_Rhapsody.png"
    },
    {
        id: "2",
        title: "Imagine",
        artist: "John Lennon",
        album: "Imagine",
        releaseYear: 1971,
        coverImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/John_Lennon_Imagine_1971.jpg/640px-John_Lennon_Imagine_1971.jpg"
    },
    {
        id: "3",
        title: "Billie Jean",
        artist: "Michael Jackson",
        album: "Thriller",
        releaseYear: 1982,
        coverImage: "https://t2.genius.com/unsafe/300x300/https%3A%2F%2Fimages.genius.com%2F9d06855287d0a499835ca1453317d6ec.1000x1000x1.jpg"
    },
    {
        id: "4",
        title: "Like a Rolling Stone",
        artist: "Bob Dylan",
        album: "Highway 61 Revisited",
        releaseYear: 1965,
        coverImage: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimg.discogs.com%2Fjd7vBzdcX0Sa1qS7MeD1xktyeYo%3D%2Ffit-in%2F600x600%2Ffilters%3Astrip_icc()%3Aformat(jpeg)%3Amode_rgb()%3Aquality(90)%2Fdiscogs-images%2FR-2932006-1370464524-6928.jpeg.jpg&f=1&nofb=1&ipt=ff4d4043369302c17020a683a2dbb05233f932d612a481cd283f21c407a61a3b"
    },
    {
        id: "5",
        title: "Smells Like Teen Spirit",
        artist: "Nirvana",
        album: "Nevermind",
        releaseYear: 1991,
        coverImage: "https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg"
    }
]

function TrackInfo({ track }: { track: Track }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 max-w-10 max-h-10 overflow-hidden rounded-md">
                <AspectRatio ratio={1}>
                    <img
                        src={track.coverImage}
                        alt={track.title}
                        className=""
                    />
                </AspectRatio>
            </div>
            <div className="flex flex-col">
                <div className="font-semibold">{track.title}</div>
                <div className="text-xs text-muted-foreground">{track.artist} &mdash; {track.album} ({track.releaseYear})</div>
            </div>
        </div>
    );
}

// Add height prop to the component props
type AsyncSelectProps = ComponentProps & { height?: string | number }

function AsyncSelect({ args, disabled, theme, height }: AsyncSelectProps): ReactElement {
    const [selectedTrackId, setSelectedTrackId] = useState<string>("")
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        console.log(args)
    }, [])

    useEffect(() => {
        console.log(disabled)
    }, [])

    useEffect(() => {
        console.log(theme)
    }, [])

    useEffect(() => {
        setTimeout(() => {
            if (containerRef.current) {
                const observer = new ResizeObserver(() => {
                    if (containerRef.current) {
                        const height = containerRef.current.clientHeight || 300
                        console.log(height)
                        Streamlit.setFrameHeight(height + 500)
                    }
                })
                observer.observe(containerRef.current)
            }
        }, 100)
    }, [])

    const findTrack = async (query?: string): Promise<Track[]> => {
        await new Promise(res => setTimeout(res, 1000)); // Simulate 1s delay
        const q = query?.toLowerCase() || ""
        return TRACKS.filter(track =>
            track.title.toLowerCase().includes(q) ||
            track.artist.toLowerCase().includes(q) ||
            track.album.toLowerCase().includes(q) ||
            track.releaseYear.toString().includes(q)
        )
    }

    return (
        <div className="w-full" ref={containerRef} style={{ height: height || '100%' }}>
            <AsyncSelectComponent<Track>
                fetcher={findTrack}
                renderOption={(track) => (
                    <TrackInfo track={track} />
                )}
                getOptionValue={(track) => track.id}
                getDisplayValue={(track) => (
                    <TrackInfo track={track} />
                )}
                notFound={<div className="py-6 text-center text-sm">No tracks found</div>}
                label="Track"
                placeholder="Search tracks..."
                value={selectedTrackId}
                onChange={setSelectedTrackId}
                width="375px"
                height={args.height || '100%'}
                loadingSkeleton={<div className="py-6 text-center text-sm">Loading...</div>}
            />
        </div>
    )
}

export default withStreamlitConnection(AsyncSelect)