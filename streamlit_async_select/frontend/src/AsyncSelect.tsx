import {
    Streamlit,
    withStreamlitConnection,
    ComponentProps,
} from "streamlit-component-lib"
import { useEffect, ReactElement, useState, useRef, use, forwardRef, RefObject } from "react"
import { AsyncSelect as AsyncSelectComponent } from "./components/ui/async-select"
import { ResultDisplay } from "./components/ResultDisplay"
import { useTheme, Theme } from "./components/theme-provider"


export function useAutoHeight(elementRef: RefObject<any>, safeSize = 10) {
    useEffect(() => {
        if (!elementRef.current) return;
        const resizeObserver = new ResizeObserver(() => {
            console.log("[useAutoHeight] setting height: ", (elementRef.current.offsetHeight ?? 0) + safeSize)
            Streamlit.setFrameHeight((elementRef.current.offsetHeight ?? 0) + safeSize)
            // Do what you want to do when the size of the element changes
        });
        resizeObserver.observe(elementRef.current);
        return () => resizeObserver.disconnect();
    }, [safeSize]);
}


type Result = {
    id: string
    title: string
    description: string
    image: string
}

// Add height prop to the component props
type AsyncSelectProps = ComponentProps & { height?: string | number }

const AsyncSelect = forwardRef<HTMLDivElement, AsyncSelectProps>(({ args, disabled, theme, height }, ref) => {
    const [selectedResult, setSelectedResult] = useState<Result | null>(null)
    const [queryResults, setQueryResults] = useState<Result[]>([])
    const [options, setOptions] = useState<Result[]>(args.results || [])
    const internalRef = useRef<HTMLDivElement>(null)
    const { setTheme } = useTheme()

    // set to base theme
    useEffect(() => {
        console.log("[AsyncSelect] setting theme: ", theme?.base)
        setTheme(theme?.base as Theme || "system")
    }, [theme])
    useAutoHeight(internalRef)
    const queryRef = useRef<string>("")
    useEffect(() => {
        if (!args.results) return
        setOptions(args.results || [])
        // If the selectedResultId is still present in new options, keep it selected
        if (selectedResult) {
            const found = (args.results || []).find(r => r.id === selectedResult.id)
            setSelectedResult(found || null)
        }
    }, [args.results])

    useEffect(() => {
        Streamlit.setComponentReady()
    }, [])


    const findResults = async (query?: string): Promise<Result[]> => {
        if (!query) {
            return []
        }
        if (query === queryRef.current) {
            return queryResults
        }
        // console.log("[findResults]. Query: ", query)

        if (query && query.length > 0) {
            Streamlit.setComponentValue({ interaction: "search", value: query })
            queryRef.current = query
            setQueryResults(options.filter((result: Result) =>
                result.title.toLowerCase().includes(query?.toLowerCase() || "") ||
                result.description.toLowerCase().includes(query?.toLowerCase() || "")
            ))
        }
        return queryResults
    }

    const handleChange = (result: Result) => {
        console.log("handleChange", result)

        setTimeout(() => {
            Streamlit.setComponentValue({
                interaction: "submit",
                value: result,
                context: {
                    results: options
                }
            })
        }, 100)
        // set the height of the component
        console.log("[AsyncSelect] setting height: ", internalRef.current?.offsetHeight ?? 0)

        Streamlit.setFrameHeight(internalRef.current?.offsetHeight ?? 0);


    }

    return (
        <div className="w-full h-full" ref={internalRef} >

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
                value={selectedResult}
                onChange={(id) => {
                    const result = options.find(r => r.id === id)
                    if (!result) {
                        setSelectedResult(null)
                        return
                    }
                    setSelectedResult(result)
                    handleChange(result)
                }}
                width={args.width || '375px'}

                loadingSkeleton={<div className="py-6 text-center text-sm">Loading...</div>}
            />
        </div>
    )
})

export default withStreamlitConnection(AsyncSelect)