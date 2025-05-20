import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { useState, useEffect, useCallback, useRef, RefObject } from "react";
import { useDebounce } from "use-debounce";
import { ChevronsUpDown, Loader2, Check } from "lucide-react";
import { Streamlit } from "streamlit-component-lib";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../../components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../components/ui/popover";

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


export interface Option {
    value: string;
    label: string;
    disabled?: boolean;
    description?: string;
    icon?: React.ReactNode;
}

export interface AsyncSelectProps<T> {
    /** Async function to fetch options */
    fetcher: (query?: string) => Promise<T[]>;
    /** Preload all data ahead of time */
    preload?: boolean;
    /** Function to filter options */
    filterFn?: (option: T, query: string) => boolean;
    /** Function to render each option */
    renderOption: (option: T) => React.ReactNode;
    /** Function to get the value from an option */
    getOptionValue: (option: T) => string;
    /** Function to get the display value for the selected option */
    getDisplayValue: (option: T) => React.ReactNode;
    /** Custom not found message */
    notFound?: React.ReactNode;
    /** Custom loading skeleton */
    loadingSkeleton?: React.ReactNode;
    /** Currently selected value */
    value: string;
    /** Callback when selection changes */
    onChange: (value: string) => void;
    /** Label for the select field */
    label: string;
    /** Placeholder text when no selection */
    placeholder?: string;
    /** Disable the entire select */
    disabled?: boolean;
    /** Custom width for the popover */
    width?: string | number;
    /** Custom height for the trigger button */
    height?: string | number;
    /** Custom class names */
    className?: string;
    /** Custom trigger button class names */
    triggerClassName?: string;
    /** Custom no results message */
    noResultsMessage?: string;
    /** Allow clearing the selection */
    clearable?: boolean;
}

export function AsyncSelect<T>({
    fetcher,
    preload,
    filterFn,
    renderOption,
    getOptionValue,
    getDisplayValue,
    notFound,
    loadingSkeleton,
    label,
    placeholder = "Select...",
    value,
    onChange,
    disabled = false,
    width = "200px",

    className,
    triggerClassName,
    noResultsMessage,
    clearable = true,
}: AsyncSelectProps<T>) {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedValue, setSelectedValue] = useState(value);
    const [selectedOption, setSelectedOption] = useState<T | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm] = useDebounce(searchTerm, preload ? 0 : 300);
    const [_originalOptions, setOriginalOptions] = useState<T[]>([]);
    const commandRef = useRef<HTMLDivElement>(null);
    const commandListRef = useRef<HTMLDivElement>(null);
    const commandInputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
        setSelectedValue(value);
    }, [value]);

    // Initialize selectedOption when options are loaded and value exists
    useEffect(() => {
        if (value && options.length > 0) {
            const option = options.find(opt => getOptionValue(opt) === value);
            if (option) {
                setSelectedOption(option);
            }
        }
    }, [value, options, getOptionValue]);
    // set height of command list
    useEffect(() => {
        const estimateHeight = () => {

            const totalHeight = [
                open ? triggerRef.current?.clientHeight ?? 0 : 0,
                open ? commandInputRef.current?.clientHeight ?? 0 : 0,
                open ? commandListRef.current?.clientHeight ?? 0 : 0,
                open ? commandRef.current?.clientHeight ?? 0 : 0,
                56,
            ].reduce((acc, h) => acc + (h ?? 0), 0);
            console.log("[async-select] setting height: ", totalHeight)
            setTimeout(() => Streamlit.setFrameHeight(totalHeight), 10)
        };
        estimateHeight();
    }, [options, open, value]);
    // Effect for initial fetch
    useEffect(() => {
        let isMounted = true;
        const initializeOptions = async () => {
            try {
                setLoading(true);
                setError(null);
                // If we have a value, use it for the initial search
                const data = await fetcher(value);
                if (isMounted) {
                    setOriginalOptions(data);
                    setOptions(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch options');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (!mounted) {
            initializeOptions();
        }
        return () => {
            isMounted = false;
        };
    }, [mounted, fetcher, value]);

    useEffect(() => {
        let isMounted = true;
        const fetchOptions = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetcher(debouncedSearchTerm);
                if (isMounted) {
                    setOriginalOptions(data);
                    setOptions(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch options');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchOptions();

        return () => {
            isMounted = false;
        };
    }, [fetcher, debouncedSearchTerm, mounted, preload, filterFn]);

    const handleSelect = useCallback((currentValue: string) => {
        const newValue = clearable && currentValue === selectedValue ? "" : currentValue;
        setSelectedValue(newValue);
        setSelectedOption(options.find((option) => getOptionValue(option) === newValue) || null);
        onChange(newValue);
    }, [selectedValue, clearable, options, getOptionValue]);

    const handleOpenChange = (open: boolean) => {
        setOpen(open);




    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <AsyncSelectTrigger
                triggerRef={triggerRef as any}
                width={width}
                open={open}
                disabled={disabled}
                triggerClassName={triggerClassName}
                placeholder={placeholder}
                selectedOption={selectedOption}
                getDisplayValue={getDisplayValue}
            />
            <AsyncSelectContent
                className={className}
                width={width}
                commandRef={commandRef as any}
                commandInputRef={commandInputRef as any}
                commandListRef={commandListRef as any}
                label={label}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                loading={loading}
                options={options}
                error={error}
                loadingSkeleton={loadingSkeleton}
                notFound={notFound}
                noResultsMessage={noResultsMessage}
                getOptionValue={getOptionValue}
                renderOption={renderOption}
                selectedValue={selectedValue}

                handleSelect={(value) => {
                    handleSelect(value);
                    setOpen(false);
                }}
            />
        </Popover>
    );
}

function AsyncSelectTrigger<T>({
    triggerRef,
    width,
    open,
    disabled,
    triggerClassName,
    placeholder,
    selectedOption,
    getDisplayValue,
}: {
    triggerRef: React.RefObject<HTMLButtonElement>;
    width: string | number;
    open: boolean;
    disabled: boolean;
    triggerClassName?: string;
    placeholder: string;
    selectedOption: T | null;
    getDisplayValue: (option: T) => React.ReactNode;
}) {
    return (
        <PopoverTrigger style={{ width: width }} asChild>
            <Button
                ref={triggerRef}
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                    "justify-between",
                    disabled && "opacity-50 cursor-not-allowed",
                    triggerClassName,
                )}
                disabled={disabled}
            >
                {selectedOption ? (
                    getDisplayValue(selectedOption)
                ) : (
                    placeholder
                )}
                <ChevronsUpDown className="opacity-50" size={10} />
            </Button>
        </PopoverTrigger>
    );
}

function AsyncSelectContent<T>({
    className,
    width,
    commandRef,
    commandInputRef,
    commandListRef,
    label,
    searchTerm,
    setSearchTerm,
    loading,
    options,
    error,
    loadingSkeleton,
    notFound,
    noResultsMessage,
    getOptionValue,
    renderOption,
    selectedValue,
    handleSelect,
}: {
    className?: string;
    width: string | number;
    commandRef: React.RefObject<HTMLDivElement>;
    commandInputRef: React.RefObject<HTMLInputElement>;
    commandListRef: React.RefObject<HTMLDivElement>;
    label: string;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    loading: boolean;
    options: T[];
    error: string | null;
    loadingSkeleton?: React.ReactNode;
    notFound?: React.ReactNode;
    noResultsMessage?: string;
    getOptionValue: (option: T) => string;
    renderOption: (option: T) => React.ReactNode;
    selectedValue: string;
    handleSelect: (value: string) => void;
}) {
    return (
        <PopoverContent style={{ width: width }} className={cn("p-0", className)}>
            <Command ref={commandRef} shouldFilter={false}>
                <div className="relative border-b w-full" >
                    <CommandInput
                        ref={commandInputRef}
                        placeholder={`Search ${label.toLowerCase()}...`}
                        value={searchTerm}
                        onValueChange={(value) => {
                            setSearchTerm(value);
                        }}
                    />
                    {loading && options.length > 0 && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    )}
                </div>
                <CommandList ref={commandListRef}>
                    {error && (
                        <div className="p-4 text-destructive text-center">
                            {error}
                        </div>
                    )}
                    {loading && options.length === 0 && (
                        loadingSkeleton || <DefaultLoadingSkeleton />
                    )}
                    {!loading && !error && options.length === 0 && (
                        notFound || <CommandEmpty>{noResultsMessage ?? `No ${label.toLowerCase()} found.`}</CommandEmpty>
                    )}
                    <CommandGroup>
                        {options.map((option) => (
                            <CommandItem
                                key={getOptionValue(option)}
                                value={getOptionValue(option)}
                                onSelect={(value) => {
                                    handleSelect(value);
                                }}
                            >
                                {renderOption(option)}
                                <Check
                                    className={cn(
                                        "ml-auto h-3 w-3",
                                        selectedValue === getOptionValue(option) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </PopoverContent>
    );
}

function DefaultLoadingSkeleton() {
    return (
        <CommandGroup>
            {[1, 2, 3].map((i) => (
                <CommandItem key={i} disabled>
                    <div className="flex items-center gap-2 w-full">
                        <div className="h-6 w-6 rounded-full animate-pulse bg-muted" />
                        <div className="flex flex-col flex-1 gap-1">
                            <div className="h-4 w-24 animate-pulse bg-muted rounded" />
                            <div className="h-3 w-16 animate-pulse bg-muted rounded" />
                        </div>
                    </div>
                </CommandItem>
            ))}
        </CommandGroup>
    );
}