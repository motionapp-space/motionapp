import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { History, ChevronDown, XCircle, Ban } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { RecentActivityItem, RecentActivityType } from "../api/client-recent-activity.api";

interface RecentActivitySectionProps {
  items: RecentActivityItem[];
}

function getActivityIcon(type: RecentActivityType) {
  switch (type) {
    case 'declined_request':
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    case 'coach_canceled_event':
      return <Ban className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'client_canceled_request':
      return <XCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

export function RecentActivitySection({ items }: RecentActivitySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-3 group">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Attività recenti
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="pb-2 space-y-1">
          {items.map((item) => (
            <div 
              key={item.id}
              className="flex items-center gap-2 py-2 px-1 text-sm"
            >
              {getActivityIcon(item.activityType)}
              <span className="text-muted-foreground flex-1 truncate">
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(new Date(item.date), "d MMM", { locale: it })}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
