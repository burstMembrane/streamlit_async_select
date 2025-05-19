import { AspectRatio } from "./ui/aspect-ratio"
function ResultDisplay({ image, title, description }: { image: string; title: string; description: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10">
                <AspectRatio ratio={1}>
                    <img
                        src={image}
                        alt={title}
                        className=""
                    />
                </AspectRatio>
            </div>
            <div className="flex flex-col">
                <div className="font-semibold">{title}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
            </div>
        </div>
    );
}

// ... existing code ...