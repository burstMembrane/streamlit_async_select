import {
    Streamlit,
    withStreamlitConnection,
    ComponentProps,
} from "streamlit-component-lib"
import { useEffect, ReactElement, useState, useRef, use } from "react"
import { AsyncSelect as AsyncSelectComponent } from "./components/ui/async-select"
import { ResultDisplay } from "./components/ResultDisplay"





type Result = {
    id: string
    title: string
    description: string
    image: string
}

// Add height prop to the component props
type AsyncSelectProps = ComponentProps & { height?: string | number }

function AsyncSelect({ args, disabled, theme, height }: AsyncSelectProps): ReactElement {
    const [selectedResultId, setSelectedResultId] = useState<string>("")
    const containerRef = useRef<HTMLDivElement>(null)
    const [options, setOptions] = useState<Result[]>(args.results || [])

    useEffect(() => {
        setOptions(args.results || [])
    }, [args.results])

    useEffect(() => {
        console.log(args)
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

    const findResults = async (query?: string): Promise<Result[]> => {
        if (query && query.length > 0) {
            Streamlit.setComponentValue({ interaction: "search", value: query })
        }
        return options.filter((result: Result) =>
            result.title.toLowerCase().includes(query?.toLowerCase() || "") ||
            result.description.toLowerCase().includes(query?.toLowerCase() || "")
        )
    }

    const handleChange = (id: string) => {

        setSelectedResultId(id)
        Streamlit.setComponentValue({ interaction: "submit", value: id })
    }

    return (
        <div className="w-full" ref={containerRef} style={{ height: height || '100%' }}>
            <div className="w-full" ref={containerRef} style={{ height: height || '100%' }}>
                <AsyncSelectComponent<Result>
                    fetcher={findResults}
                    renderOption={(result) => (
                        <ResultDisplay
                            key={result.id}
                            image={result.image}
                            title={result.title}
                            description={result.description}
                        />
                    )}

                    getOptionValue={result => result.id}
                    getDisplayValue={result => (
                        <ResultDisplay
                            key={result.id}
                            image={result.image}
                            title={result.title}
                            description={result.description}
                        />
                    )}
                    notFound={<div className="py-6 text-center text-sm">No results found</div>}
                    label="Result"
                    placeholder="Search results..."
                    value={selectedResultId}
                    onChange={handleChange}
                    width={args.width || '375px'}
                    height={args.height || '100%'}
                    loadingSkeleton={<div className="py-6 text-center text-sm">Loading...</div>}
                />
            </div>
        </div>
    )
}

export default withStreamlitConnection(AsyncSelect)