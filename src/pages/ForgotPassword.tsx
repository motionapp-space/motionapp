import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const isClientContext = searchParams.get("context") === "client";
  const loginPath = isClientContext ? "/client/auth" : "/auth";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password${isClientContext ? '?context=client' : ''}`,
      });

      if (error) throw error;
      
      setSubmitted(true);
    } catch (error: any) {
      toast.error("Si è verificato un errore. Riprova più tardi.");
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-[hsl(220,70%,95%)] rounded-3xl flex items-center justify-center">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Controlla la tua email</h1>
              <p className="text-muted-foreground mt-2">
                Una mail è stata inviata all'indirizzo inserito.
              </p>
            </div>
          </div>
          <Button 
            asChild 
            className="w-full h-14 rounded-3xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Link to={loginPath}>Torna al login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-[hsl(220,70%,95%)] rounded-3xl flex items-center justify-center">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reimposta la password</h1>
            <p className="text-muted-foreground mt-2">
              Inserisci la tua email e ti invieremo un link per reimpostare la password.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tuaemail@esempio.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="h-12 rounded-2xl bg-card border-border text-base"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-14 rounded-3xl text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
            disabled={loading}
          >
            {loading ? "Invio in corso..." : "Invia link di reset"}
          </Button>
          <Button 
            asChild 
            variant="ghost" 
            className="w-full h-12 rounded-3xl text-base"
          >
            <Link to={loginPath}>Torna al login</Link>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
