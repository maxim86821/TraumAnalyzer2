import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Weiterleiten, wenn der Benutzer bereits angemeldet ist
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  if (user) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Anmeldeformular */}
        <div className="flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="register">Registrieren</TabsTrigger>
              </TabsList>
              
              {/* Login-Tab */}
              <TabsContent value="login">
                <LoginForm onLogin={(username, password) => {
                  loginMutation.mutate({ username, password }, {
                    onError: (error: Error) => {
                      toast({
                        title: "Anmeldung fehlgeschlagen",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  });
                }} isPending={loginMutation.isPending} />
              </TabsContent>
              
              {/* Registrierungs-Tab */}
              <TabsContent value="register">
                <RegisterForm onRegister={(username, password) => {
                  console.log("Registrierungsversuch:", { username, password });
                  registerMutation.mutate({ username, password }, {
                    onSuccess: () => {
                      console.log("Registrierung erfolgreich");
                    },
                    onError: (error: Error) => {
                      console.error("Registrierungsfehler:", error);
                      toast({
                        title: "Registrierung fehlgeschlagen",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  });
                }} isPending={registerMutation.isPending} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Hero-Bereich */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Willkommen bei deinem Traumtagebuch
            </h1>
            <p className="text-muted-foreground">
              Zeichne deine Träume auf, analysiere deren Bedeutung und entdecke wiederkehrende Muster und Symbole.
              Mit KI-gestützter Analyse erhältst du Einblicke in deine Traumwelt.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Aufzeichnung deiner Träume mit Text und Bildern
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> KI-gestützte Analyse der Traumsymbole und -themen
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Erkennung von Mustern in deinen Träumen
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Sicherer, privater Traumspeicher
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin, isPending }: { onLogin: (username: string, password: string) => void, isPending: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>Melde dich mit deinem Benutzerkonto an</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-username">Benutzername</Label>
            <Input 
              id="login-username" 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Dein Benutzername" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Passwort</Label>
            <Input 
              id="login-password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Dein Passwort" 
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Anmeldung läuft..." : "Anmelden"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function RegisterForm({ onRegister, isPending }: { onRegister: (username: string, password: string) => void, isPending: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validiere Benutzername (mindestens 3 Zeichen)
    if (username.length < 3) {
      toast({
        title: "Benutzername zu kurz",
        description: "Der Benutzername muss mindestens 3 Zeichen lang sein",
        variant: "destructive"
      });
      return;
    }
    
    // Validiere Passwort (mindestens 6 Zeichen)
    if (password.length < 6) {
      toast({
        title: "Passwort zu kurz",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein",
        variant: "destructive"
      });
      return;
    }
    
    // Validiere Passwortbestätigung
    if (password !== passwordConfirm) {
      toast({
        title: "Passwörter stimmen nicht überein",
        description: "Bitte überprüfe deine Passwörter und versuche es erneut",
        variant: "destructive"
      });
      return;
    }
    
    onRegister(username, password);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrieren</CardTitle>
        <CardDescription>Erstelle ein neues Benutzerkonto</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-username">Benutzername</Label>
            <Input 
              id="register-username" 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Wähle einen Benutzernamen" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Passwort</Label>
            <Input 
              id="register-password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Wähle ein sicheres Passwort" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password-confirm">Passwort bestätigen</Label>
            <Input 
              id="register-password-confirm" 
              type="password" 
              required 
              value={passwordConfirm} 
              onChange={(e) => setPasswordConfirm(e.target.value)} 
              placeholder="Passwort erneut eingeben" 
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Registrierung läuft..." : "Registrieren"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}