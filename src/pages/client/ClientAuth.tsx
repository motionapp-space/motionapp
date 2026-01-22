import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dumbbell, Eye, EyeOff } from "lucide-react";

const ClientAuth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/client/app/workouts", { replace: true });
      }
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/client/app/workouts", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'accesso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(220,70%,95%)]">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Motion
            </h1>
            <p className="mt-2 text-muted-foreground">Area Clienti</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tuaemail@esempio.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-2xl border-border bg-card text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-2xl border-border bg-card pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password?context=client"
                className="text-sm text-primary hover:underline"
              >
                Hai dimenticato la password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-3xl text-base font-semibold shadow-lg transition-shadow hover:shadow-xl"
          >
            {loading ? "Accesso in corso..." : "ACCEDI"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ClientAuth;
