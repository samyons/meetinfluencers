import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/scrape")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

type LogEntry = {
  type: "start" | "progress" | "success" | "error";
  message: string;
  timestamp: string;
};

function RouteComponent() {
  const [username, setUsername] = useState("");
  const [sessionUsername, setSessionUsername] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [lastScrapedId, setLastScrapedId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const connectSSE = () => {
    const eventSource = new EventSource(
      `http://localhost:3000/api/scrape/stream/${sessionId}`
    );

    eventSource.addEventListener("start", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, data]);
    });

    eventSource.addEventListener("progress", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, data]);
    });

    eventSource.addEventListener("success", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, data]);
      eventSource.close();
    });

    eventSource.addEventListener("error", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, data]);
      eventSource.close();
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.scrape.scrapeInfluencer.mutate({
        username: username.replace("@", "").trim(),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sessionId,
        sessionUsername: sessionUsername.trim() || undefined,
      });
    },
    onSuccess: (data) => {
      toast.success(`${data.postsScraped} posts scrapés avec succès!`);
      queryClient.invalidateQueries({ queryKey: ["influencer"] });
      setLastScrapedId(data.influencerId);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Le username est requis");
      return;
    }

    setLogs([]);
    setLastScrapedId(null);
    connectSSE();
    scrapeMutation.mutate();
  };

  const handleClear = () => {
    setUsername("");
    setSessionUsername("");
    setDateFrom("");
    setDateTo("");
    setLogs([]);
    setLastScrapedId(null);
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "start":
        return <Info className="h-4 w-4 text-blue-400" />;
      case "progress":
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const isComplete = logs.some((l) => l.type === "success" || l.type === "error");
  const hasError = logs.some((l) => l.type === "error");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Scraper un Influenceur</h1>
          <p className="text-sm text-muted-foreground">
            Récupérez les posts et métadonnées d'un profil Instagram
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
            <CardDescription>
              Entrez le username Instagram à scraper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username Instagram</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username ou username"
                  disabled={scrapeMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionUsername">Session Username (optionnel)</Label>
                <Input
                  id="sessionUsername"
                  type="text"
                  value={sessionUsername}
                  onChange={(e) => setSessionUsername(e.target.value)}
                  placeholder="Votre username Instagram pour l'auth"
                  disabled={scrapeMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Requis pour scraper plus de 12 posts. Utilisez le username de votre session (ex: samy.ouanes)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Période (optionnel)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                      Du
                    </Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      disabled={scrapeMutation.isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                      Au
                    </Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      disabled={scrapeMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={scrapeMutation.isPending || !username.trim()}
                  className="flex-1"
                >
                  {scrapeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scraping en cours...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Lancer le scraping
                    </>
                  )}
                </Button>
                {!scrapeMutation.isPending && (username || logs.length > 0) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

            {lastScrapedId && isComplete && !hasError && (
              <div className="mt-4 pt-4 border-t">
                <Link
                  to="/influencers/$id"
                  params={{ id: lastScrapedId }}
                  className={`${buttonVariants({ variant: "secondary" })} w-full`}
                >
                  Voir le profil scrapé
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Logs en temps réel</CardTitle>
              {scrapeMutation.isPending && (
                <Badge variant="secondary" className="animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  En cours
                </Badge>
              )}
              {isComplete && !hasError && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Terminé
                </Badge>
              )}
              {hasError && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Erreur
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] rounded-b-lg">
              <div className="p-4 font-mono text-sm bg-zinc-950 min-h-full">
                {logs.length === 0 ? (
                  <div className="text-zinc-500 text-center py-12">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p>Les logs apparaîtront ici...</p>
                    <p className="text-xs mt-1">Lancez un scraping pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-2 ${
                          log.type === "error"
                            ? "text-red-400"
                            : log.type === "success"
                              ? "text-green-400"
                              : log.type === "start"
                                ? "text-blue-400"
                                : "text-zinc-300"
                        }`}
                      >
                        <span className="shrink-0 mt-0.5">{getLogIcon(log.type)}</span>
                        <span className="text-zinc-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
