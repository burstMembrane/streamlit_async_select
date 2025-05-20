import { AspectRatio } from "./ui/aspect-ratio"

export function ResultDisplay({ image, title, description }: { image: string; title: string; description: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8">
                <AspectRatio ratio={1}>
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full"
                        style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </AspectRatio>
            </div>
            <div className="flex flex-col">
                <div className="font-semibold text-ellipsis overflow-hidden">{title}</div>
                <div className="text-xs text-muted-foreground text-ellipsis overflow-hidden">{description}</div>
            </div>
        </div>
    );
}
