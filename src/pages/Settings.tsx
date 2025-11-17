import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Lock, Shield, Calendar, Package } from "lucide-react";
import { BookingSettingsForm } from "@/features/bookings/components/BookingSettingsForm";
import { PackageSettingsForm } from "@/features/packages/components/PackageSettingsForm";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", locale: "it" });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("coaches")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({ 
          name: data.name || "", 
          email: data.email || "",
          locale: data.locale || "it"
        });
      }
    } catch (error: any) {
      toast.error("Errore nel caricamento del profilo");
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("coaches")
        .update({ name: profile.name, locale: profile.locale })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profilo aggiornato");
    } catch (error: any) {
      toast.error("Errore nell'aggiornamento del profilo");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("Le password non corrispondono");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;
      toast.success("Password modificata con successo");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error("Errore nella modifica della password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl pb-8">
      <div className="mb-6">
        <PageHeading className="mb-2">Impostazioni</PageHeading>
        <p className="text-muted-foreground">Gestisci il tuo account e le preferenze</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profilo
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            <Lock className="h-4 w-4" />
            Credenziali
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Calendar className="h-4 w-4" />
            Prenotazioni
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-2">
            <Package className="h-4 w-4" />
            Pacchetti
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profilo</CardTitle>
              <CardDescription>Gestisci le informazioni del tuo profilo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Il tuo nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">L'email non può essere modificata</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locale">Lingua interfaccia</Label>
                <Select
                  value="it"
                  disabled={true}
                >
                  <SelectTrigger id="locale" className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={updateProfile} disabled={loading}>
                {loading ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Credenziali</CardTitle>
              <CardDescription>Modifica la tua password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nuova Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma Nuova Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <Button onClick={changePassword} disabled={loading}>
                {loading ? "Modifica in corso..." : "Modifica Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <BookingSettingsForm />
        </TabsContent>

        <TabsContent value="packages">
          <PackageSettingsForm />
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Gestisci le tue preferenze sulla privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Per informazioni complete sulla privacy e sui cookie, consulta le nostre politiche:
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://www.iubenda.com/privacy-policy" target="_blank" rel="noopener noreferrer">
                    Informativa Privacy
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://www.iubenda.com/privacy-policy/cookie-policy" target="_blank" rel="noopener noreferrer">
                    Politica Cookie
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;