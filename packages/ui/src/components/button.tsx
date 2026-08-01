import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@sarjy-sql/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full border font-semibold outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "border-ink bg-lime text-ink hover:bg-lime/85",
				secondary: "border-ink bg-periwinkle text-ink hover:bg-periwinkle/85",
				outline:
					"border-foreground/40 bg-transparent text-foreground hover:bg-foreground/10",
				ghost: "border-transparent text-foreground hover:bg-foreground/10",
				destructive: "border-ink bg-tangerine text-ink hover:bg-tangerine/85",
				link: "border-transparent text-foreground underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 gap-2 px-4 text-sm",
				xs: "h-7 gap-1.5 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1.5 px-3.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-11 gap-2 px-6 text-sm",
				icon: "size-9 active:scale-95",
				"icon-xs":
					"size-7 active:scale-95 [&_svg:not([class*='size-'])]:size-3.5",
				"icon-sm": "size-8 active:scale-95",
				"icon-lg": "size-11 active:scale-95",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
