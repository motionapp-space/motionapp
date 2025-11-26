import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type TopbarContextType = {
  title: string;
  setTitle: (title: string) => void;
  showBack: boolean;
  setShowBack: (show: boolean) => void;
  onBack: (() => void) | undefined;
  setOnBack: (fn: (() => void) | undefined) => void;
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
};

const TopbarContext = createContext<TopbarContextType | undefined>(undefined);

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("");
  const [showBack, setShowBack] = useState(false);
  const [onBack, setOnBack] = useState<(() => void) | undefined>(undefined);
  const [actions, setActions] = useState<ReactNode>(null);

  return (
    <TopbarContext.Provider
      value={{
        title,
        setTitle,
        showBack,
        setShowBack,
        onBack,
        setOnBack,
        actions,
        setActions,
      }}
    >
      {children}
    </TopbarContext.Provider>
  );
}

export function useTopbar(config: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
}) {
  const context = useContext(TopbarContext);
  if (!context) {
    throw new Error("useTopbar must be used within TopbarProvider");
  }

  const { setTitle, setShowBack, setOnBack, setActions } = context;

  useEffect(() => {
    setTitle(config.title);
    setShowBack(config.showBack ?? false);
    setOnBack(() => config.onBack);
    setActions(config.actions ?? null);

    // Cleanup on unmount
    return () => {
      setTitle("");
      setShowBack(false);
      setOnBack(undefined);
      setActions(null);
    };
  }, [config.title, config.showBack, config.onBack, config.actions, setTitle, setShowBack, setOnBack, setActions]);
}

export function useTopbarContext() {
  const context = useContext(TopbarContext);
  if (!context) {
    throw new Error("useTopbarContext must be used within TopbarProvider");
  }
  return context;
}
