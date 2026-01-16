import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type TopbarContextType = {
  title: string;
  setTitle: (title: string) => void;
  subtitle: string;
  setSubtitle: (subtitle: string) => void;
  showBack: boolean;
  setShowBack: (show: boolean) => void;
  onBack: (() => void) | undefined;
  setOnBack: (fn: (() => void) | undefined) => void;
  showLegendIcon: boolean;
  setShowLegendIcon: (show: boolean) => void;
  onLegendClick: (() => void) | undefined;
  setOnLegendClick: (fn: (() => void) | undefined) => void;
};

const TopbarContext = createContext<TopbarContextType | undefined>(undefined);

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [showBack, setShowBack] = useState(false);
  const [onBack, setOnBack] = useState<(() => void) | undefined>(undefined);
  const [showLegendIcon, setShowLegendIcon] = useState(false);
  const [onLegendClick, setOnLegendClick] = useState<(() => void) | undefined>(undefined);

  return (
    <TopbarContext.Provider
      value={{
        title,
        setTitle,
        subtitle,
        setSubtitle,
        showBack,
        setShowBack,
        onBack,
        setOnBack,
        showLegendIcon,
        setShowLegendIcon,
        onLegendClick,
        setOnLegendClick,
      }}
    >
      {children}
    </TopbarContext.Provider>
  );
}

export function useTopbar(config: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showLegendIcon?: boolean;
  onLegendClick?: () => void;
}) {
  const context = useContext(TopbarContext);
  if (!context) {
    throw new Error("useTopbar must be used within TopbarProvider");
  }

  const { setTitle, setSubtitle, setShowBack, setOnBack, setShowLegendIcon, setOnLegendClick } = context;

  useEffect(() => {
    setTitle(config.title);
    setSubtitle(config.subtitle ?? "");
    setShowBack(config.showBack ?? false);
    setOnBack(() => config.onBack);
    setShowLegendIcon(config.showLegendIcon ?? false);
    setOnLegendClick(() => config.onLegendClick);

    // Cleanup on unmount
    return () => {
      setTitle("");
      setSubtitle("");
      setShowBack(false);
      setOnBack(undefined);
      setShowLegendIcon(false);
      setOnLegendClick(undefined);
    };
  }, [config.title, config.subtitle, config.showBack, config.onBack, config.showLegendIcon, config.onLegendClick, setTitle, setSubtitle, setShowBack, setOnBack, setShowLegendIcon, setOnLegendClick]);
}

export function useTopbarContext() {
  const context = useContext(TopbarContext);
  if (!context) {
    throw new Error("useTopbarContext must be used within TopbarProvider");
  }
  return context;
}
