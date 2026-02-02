import { Shield, Users, Mail, Settings } from "lucide-react";
import SectionShell from "@/components/layout/SectionShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Admin Dashboard v0 - Minimal MVP
 * Placeholder for future admin functionality
 */
export default function AdminDashboard() {
  return (
    <SectionShell title="Admin Dashboard">
      {/* Main description card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Sezione Amministratori</CardTitle>
              <CardDescription>
                Area riservata per la gestione del sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Placeholder cards for future features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Inviti</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Gestione inviti coach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Utenti</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Panoramica utenti sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Sistema</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Configurazioni e log
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  );
}
