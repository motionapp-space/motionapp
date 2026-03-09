import { useTopbar } from "@/contexts/TopbarContext";
import SectionShell from "@/components/layout/SectionShell";
import KpiStrip from "@/features/dashboard/components/KpiStrip";
import ActivityTrendCard from "@/features/dashboard/components/ActivityTrendCard";
import TodayEventsCard from "@/features/dashboard/components/TodayEventsCard";
import PendingActionsCard from "@/features/dashboard/components/PendingActionsCard";
import ClientsLowSessionsCard from "@/features/dashboard/components/ClientsLowSessionsCard";
import InactiveClientsCard from "@/features/dashboard/components/InactiveClientsCard";

export default function Dashboard() {
  useTopbar({ title: "Dashboard" });

  return (
    <SectionShell>
      <div className="space-y-6 pb-8">
        <KpiStrip />

        <div className="space-y-5">
          <ActivityTrendCard />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <TodayEventsCard />
            </div>
            <div className="lg:col-span-4">
              <PendingActionsCard />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientsLowSessionsCard />
          <InactiveClientsCard />
        </div>
      </div>
    </SectionShell>
  );
}
