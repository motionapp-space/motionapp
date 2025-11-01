import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, UserX, UsersRound, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import { useUpcomingEvents } from "@/features/dashboard/hooks/useUpcomingEvents";
import { ClientTrendChart } from "@/features/dashboard/components/ClientTrendChart";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: eventsData, isLoading: eventsLoading } = useUpcomingEvents();

  const kpiCards = [
    {
      label: "Clienti attivi",
      value: stats?.activeClients || 0,
      change: stats?.activeClientsChange || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      link: "/clients?status=ATTIVO",
      tooltip: "Clienti con stato ATTIVO",
    },
    {
      label: "Nuovi clienti",
      value: stats?.newClients || 0,
      change: stats?.newClientsChange || 0,
      icon: UserPlus,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      link: "/clients?sort=created_desc",
      tooltip: "Clienti creati questo mese",
    },
    {
      label: "Clienti inattivi",
      value: stats?.terminatedClients || 0,
      change: stats?.terminatedClientsChange || 0,
      icon: UserX,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      link: "/clients?status=INATTIVO",
      tooltip: "Clienti con stato INATTIVO",
    },
    {
      label: "Totale clienti",
      value: stats?.totalClients || 0,
      change: stats?.totalClientsChange || 0,
      icon: UsersRound,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      link: "/clients",
      tooltip: "Tutti i clienti",
    },
  ];

  const renderChangeIndicator = (change: number) => {
    if (change === 0) return <span className="text-muted-foreground">0%</span>;

    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
      <span
        className={cn("flex items-center gap-1 text-sm font-medium", isPositive ? "text-green-600" : "text-red-600")}
      >
        <Icon className="h-3 w-3" />
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Dashboard" subtitle="Panoramica della tua attività" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-6 md:pb-8 space-y-8">
        {/* KPI Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Panoramica clienti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-12" />
                  </Card>
                ))
              : kpiCards.map((kpi, index) => {
                  const Icon = kpi.icon;
                  return (
                    <Link key={index} to={kpi.link}>
                      <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn("p-3 rounded-lg", kpi.bgColor)}>
                            <Icon className={cn("h-6 w-6", kpi.color)} />
                          </div>
                          {renderChangeIndicator(kpi.change)}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                          <p className="text-3xl font-bold">{kpi.value}</p>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
          </div>
        </section>

        {/* Client Trend Chart */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Andamento clienti</h2>
            <Link to="/clients">
              <Button variant="outline" size="sm">
                Analizza clienti
              </Button>
            </Link>
          </div>
          <Card className="p-6">
            {statsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ClientTrendChart data={stats?.trendData || []} />
            )}
          </Card>
        </section>

        {/* Upcoming Events */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Prossimi appuntamenti</h2>
            {eventsLoading ? (
              <Skeleton className="h-5 w-64" />
            ) : (
              <p className="text-sm text-muted-foreground">
                Hai {eventsData?.count || 0} appuntamenti nei prossimi 7 giorni
                {eventsData?.change !== undefined && eventsData.change !== 0 && (
                  <span className={cn("ml-2 font-medium", eventsData.change > 0 ? "text-green-600" : "text-red-600")}>
                    ({eventsData.change > 0 ? "+" : ""}
                    {eventsData.change.toFixed(0)}% vs settimana scorsa)
                  </span>
                )}
              </p>
            )}
          </div>

          <Card className="p-6">
            {eventsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !eventsData?.events || eventsData.events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Nessun appuntamento nei prossimi giorni. Pianifica le tue prossime sessioni!
                </p>
                <Link to="/calendar">
                  <Button>Apri calendario</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {eventsData.events.slice(0, 5).map((event) => (
                  <Link
                    key={event.id}
                    to="/calendar"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[56px]">
                      <span className="text-xs font-medium text-primary">
                        {format(parseISO(event.start_at), "MMM", { locale: it }).toUpperCase()}
                      </span>
                      <span className="text-lg font-bold text-primary">{format(parseISO(event.start_at), "dd")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.client_name} • {format(parseISO(event.start_at), "HH:mm", { locale: it })}
                      </p>
                    </div>
                  </Link>
                ))}

                {eventsData.count > 5 && (
                  <div className="text-center pt-2">
                    <Link to="/calendar">
                      <Button variant="ghost" size="sm">
                        +{eventsData.count - 5} altri appuntamenti
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Link to="/calendar" className="block">
                    <Button className="w-full">Apri calendario completo</Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
