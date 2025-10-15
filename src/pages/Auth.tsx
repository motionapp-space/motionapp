import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dumbbell, Eye, EyeOff, Check, X } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/plans");
      }
    });
  }, [navigate]);

  // Password validation rules
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordValidation).every(Boolean);
  }, [passwordValidation]);

  const passwordsMatch = useMemo(() => {
    return password === confirmPassword && confirmPassword.length > 0;
  }, [password, confirmPassword]);

  const canRegister = useMemo(() => {
    return name.trim() !== "" && 
           email.trim() !== "" && 
           isPasswordValid && 
           passwordsMatch && 
           acceptedTerms;
  }, [name, email, isPasswordValid, passwordsMatch, acceptedTerms]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      toast.success("Account creato con successo! Accedi per continuare.");
      setEmail("");
      setPassword("");
      setName("");
      setConfirmPassword("");
      setAcceptedTerms(false);
    } catch (error: any) {
      toast.error(error.message || "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/plans");
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'accesso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">PlanPal</CardTitle>
          <CardDescription>
            Crea e gestisci piani di allenamento professionali con l'assistenza AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Accedi</TabsTrigger>
              <TabsTrigger value="signup">Registrati</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input
                    id="email-signin"
                    type="email"
                    placeholder="tuaemail@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <div className="relative">
                    <Input
                      id="password-signin"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Accesso in corso..." : "Accedi"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-signup">Nome</Label>
                  <Input
                    id="name-signup"
                    type="text"
                    placeholder="Il tuo nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="tuaemail@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <div className="relative">
                    <Input
                      id="password-signup"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password validation checklist */}
                  <div className="mt-3 space-y-1.5 text-sm">
                    <p className="font-medium text-muted-foreground mb-2">La password deve contenere:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {passwordValidation.minLength ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={passwordValidation.minLength ? "text-green-600" : "text-muted-foreground"}>
                          Almeno 8 caratteri
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordValidation.hasUppercase ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={passwordValidation.hasUppercase ? "text-green-600" : "text-muted-foreground"}>
                          Almeno una lettera maiuscola
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordValidation.hasLowercase ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={passwordValidation.hasLowercase ? "text-green-600" : "text-muted-foreground"}>
                          Almeno una lettera minuscola
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordValidation.hasNumber ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={passwordValidation.hasNumber ? "text-green-600" : "text-muted-foreground"}>
                          Almeno un numero
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordValidation.hasSpecial ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={passwordValidation.hasSpecial ? "text-green-600" : "text-muted-foreground"}>
                          Almeno un carattere speciale (!@#$%^&*...)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password-signup">Conferma Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password-signup"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      {passwordsMatch ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-600">Le password corrispondono</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-destructive">Le password non corrispondono</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-tight cursor-pointer"
                  >
                    Accetto i{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Termini e Condizioni
                    </a>
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !canRegister}>
                  {loading ? "Registrazione in corso..." : "Registrati"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;