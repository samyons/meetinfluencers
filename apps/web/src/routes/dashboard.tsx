import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { StatCard } from "@/components/stat-card";
import { InfluencerCard } from "@/components/influencer-card";
import { ScrapeStatusBadge } from "@/components/scrape-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  FileText,
  Heart,
  Search,
  History,
  Plus,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const influencers = useQuery(trpc.influencer.list.queryOptions());
  const scrapeLogs = useQuery(trpc.scrapeLog.list.queryOptions({ limit: 5 }));

  const stats = {
    totalInfluencers: influencers.data?.length || 0,
    totalPosts: influencers.data?.reduce((sum, inf) => sum + inf.postsCount, 0) || 0,
    totalFollowers: influencers.data?.reduce((sum, inf) => sum + inf.followers, 0) || 0,
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Bonjour, {session.data?.user.name?.split(" ")[0] || "Utilisateur"}
          </h1>
          <p className="text-muted-foreground">
            Voici un aperçu de votre activité
          </p>
        </div>
        <Link to="/scrape" className={buttonVariants({ variant: "default" })}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau scrape
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Influenceurs"
          value={stats.totalInfluencers}
          icon={Users}
          description="Profils scrapés"
        />
        <StatCard
          title="Posts"
          value={formatNumber(stats.totalPosts)}
          icon={FileText}
          description="Posts analysés"
        />
        <StatCard
          title="Reach total"
          value={formatNumber(stats.totalFollowers)}
          icon={Heart}
          description="Followers cumulés"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Influenceurs récents</CardTitle>
            <Link to="/influencers" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {influencers.isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            )}

            {influencers.data && influencers.data.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Aucun influenceur</p>
                <Link to="/scrape" className={buttonVariants({ variant: "default", size: "sm" })}>
                  <Search className="h-4 w-4 mr-2" />
                  Scraper un influenceur
                </Link>
              </div>
            )}

            {influencers.data && influencers.data.length > 0 && (
              <div className="space-y-3">
                {influencers.data.slice(0, 4).map((inf) => (
                  <InfluencerCard
                    key={inf.id}
                    id={inf.id}
                    username={inf.username}
                    fullName={inf.fullName}
                    followers={inf.followers}
                    postsCount={inf.postsCount}
                    profilePicUrl={inf.profilePicUrl}
                    isVerified={inf.isVerified}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Activité récente</CardTitle>
            <Link to="/history" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {scrapeLogs.isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            )}

            {scrapeLogs.data && scrapeLogs.data.length === 0 && (
              <div className="text-center py-8">
                <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune activité récente</p>
              </div>
            )}

            {scrapeLogs.data && scrapeLogs.data.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Influenceur</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scrapeLogs.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={log.influencerProfilePic || undefined} />
                            <AvatarFallback className="text-xs">
                              {log.influencerUsername?.slice(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">@{log.influencerUsername}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.postsCount}</TableCell>
                      <TableCell>
                        <ScrapeStatusBadge status={log.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
