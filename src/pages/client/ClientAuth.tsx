import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ClientAuth = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login Cliente</CardTitle>
          <CardDescription>
            Area di accesso per i clienti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Funzionalità in sviluppo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAuth;
