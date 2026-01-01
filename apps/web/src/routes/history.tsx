import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { ScrapeStatusBadge } from "@/components/scrape-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { History, ExternalLink, Search } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

function RouteComponent() {
  const scrapeLogs = useQuery(trpc.scrapeLog.list.queryOptions());

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Historique des Scrapes</h1>
            <p className="text-sm text-muted-foreground">
              Tous les scrapes effectués sur la plateforme
            </p>
          </div>
        </div>
        <Link to="/scrape" className={buttonVariants({ variant: "default" })}>
          <Search className="h-4 w-4 mr-2" />
          Nouveau scrape
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {scrapeLogs.data?.length || 0} scrapes enregistrés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scrapeLogs.isLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          )}

          {scrapeLogs.error && (
            <div className="text-center py-12 text-destructive">
              Erreur: {scrapeLogs.error.message}
            </div>
          )}

          {scrapeLogs.data && scrapeLogs.data.length === 0 && (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun scrape enregistré</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par scraper un influenceur
              </p>
              <Link to="/scrape" className={buttonVariants({ variant: "default" })}>
                <Search className="h-4 w-4 mr-2" />
                Scraper un influenceur
              </Link>
            </div>
          )}

          {scrapeLogs.data && scrapeLogs.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influenceur</TableHead>
                  <TableHead>Date du scrape</TableHead>
                  <TableHead>Période scrapée</TableHead>
                  <TableHead className="text-center">Posts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapeLogs.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.influencerProfilePic || undefined} />
                          <AvatarFallback>
                            {log.influencerUsername?.slice(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{log.influencerFullName || "Inconnu"}</p>
                          <p className="text-xs text-muted-foreground">
                            @{log.influencerUsername || "inconnu"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(log.scrapedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(log.dateFrom).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                        {" → "}
                        {new Date(log.dateTo).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {log.postsCount}
                    </TableCell>
                    <TableCell>
                      <ScrapeStatusBadge status={log.status} />
                    </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to="/influencers/$id"
                          params={{ id: log.influencerId }}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
