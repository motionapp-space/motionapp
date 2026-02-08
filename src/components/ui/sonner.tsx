import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:font-sans group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-sm group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-sm",
          success:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-accent group-[.toaster]:bg-card",
          error:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive group-[.toaster]:bg-card",
          info:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary group-[.toaster]:bg-card",
          warning:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500 group-[.toaster]:bg-card",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
