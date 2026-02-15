import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dumbbell, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface InviteValidation {
  valid: boolean;
  email?: string;
  clientName?: string;
  expiresAt?: string;
  error?: string;
}

const ClientAcceptInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [validation, setValidation] = useState<InviteValidation | null>(null);
  const [validating, setValidating] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setValidation({ valid: false, error: "Token mancante" });
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("validate-invite", {
          body: { token },
        });

        if (error) {
          setValidation({ valid: false, error: error.message });
        } else {
          setValidation(data);
        }
      } catch (err) {
        setValidation({ valid: false, error: "Errore durante la validazione" });
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Le password non corrispondono");
      return;
    }

    if (password.length < 8) {
      toast.error("La password deve essere di almeno 8 caratteri");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("accept-invite", {
        body: { token, password },
      });

      if (error) {
        toast.error(error.message || "Errore durante la registrazione");
        return;
      }

      if (data?.success) {
        setSuccess(true);
        toast.success("Account creato con successo!");
        setTimeout(() => {
          navigate("/client/auth", { replace: true });
        }, 2000);
      } else {
        toast.error(data?.error || "Errore durante la registrazione");
      }
    } catch (err: any) {
      toast.error(err.message || "Errore durante la registrazione");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (validating) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifica invito in corso...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Registrazione completata!</h2>
          <p className="text-muted-foreground">Reindirizzamento al login...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!validation?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Invito non valido</h2>
            <p className="text-center text-muted-foreground">
              {validation?.error || "Questo link di invito non è valido o è scaduto."}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/client/auth")}
              className="mt-4"
            >
              Vai al login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Valid invite - show registration form
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--accent-soft-6))]">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Motion
            </h1>
            <p className="mt-2 text-muted-foreground">Completa la registrazione</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="rounded-2xl bg-card p-4 text-center">
          <p className="text-[15px] leading-6 text-muted-foreground">Benvenuto/a,</p>
          <p className="text-lg font-semibold text-foreground">{validation.clientName}</p>
          <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
            Crea una password per accedere alla tua area personale
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={validation.email || ""}
              disabled
              className="h-12 rounded-2xl border-border bg-muted text-base"
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
                placeholder="Minimo 8 caratteri"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Conferma Password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Ripeti la password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="h-12 rounded-2xl border-border bg-card text-base"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || password.length < 8 || password !== confirmPassword}
            className="h-14 w-full rounded-3xl text-base font-semibold shadow-lg transition-shadow hover:shadow-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creazione account...
              </>
            ) : (
              "CREA ACCOUNT"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ClientAcceptInvite;
