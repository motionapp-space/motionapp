import { Shield, Users, Mail, MessageSquare, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import SectionShell from "@/components/layout/SectionShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Admin Dashboard v0 - Minimal MVP
 * Placeholder for future admin functionality
 */
export default function AdminDashboard() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Errore durante il logout");
    }
  };

  return (
    <SectionShell
      title="Admin Dashboard"
      toolbar={
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Esci
        </Button>
      }
    >
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

      {/* Feature cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/admin/invites">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Inviti</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Gestione inviti coach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-primary font-medium">Gestisci →</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/coaches">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Coach</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Panoramica coach iscritti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-primary font-medium">Visualizza →</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/feedback">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Feedback</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Feedback ricevuti dagli utenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-primary font-medium">Leggi →</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </SectionShell>
  );
}
