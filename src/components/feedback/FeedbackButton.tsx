import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeedbackButtonProps {
  onClick: () => void;
}

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            size="icon"
            className="h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-shadow"
            aria-label="Invia feedback"
          >
            <MessageSquarePlus className="h-8 w-8" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Invia feedback</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
