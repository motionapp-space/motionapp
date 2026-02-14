import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import type { PaymentStatusFilter } from "../types";

interface Props {
  status: PaymentStatusFilter;
  onStatusChange: (v: PaymentStatusFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (v: DateRange | undefined) => void;
}

export function PaymentFilters({
  status,
  onStatusChange,
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Tabs
        value={status}
        onValueChange={(v) => onStatusChange(v as PaymentStatusFilter)}
        className="shrink-0"
      >
        <TabsList>
          <TabsTrigger value="all">Tutti</TabsTrigger>
          <TabsTrigger value="due">Da Pagare</TabsTrigger>
          <TabsTrigger value="paid">Pagati</TabsTrigger>
          <TabsTrigger value="draft">In Attesa</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
