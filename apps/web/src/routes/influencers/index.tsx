import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { InfluencerCard } from "@/components/influencer-card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Users, ArrowUpDown } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/influencers/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

type SortOption = "followers-desc" | "followers-asc" | "posts-desc" | "posts-asc" | "name-asc";

function RouteComponent() {
  const influencers = useQuery(trpc.influencer.list.queryOptions());
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("followers-desc");

  const filteredAndSortedInfluencers = useMemo(() => {
    if (!influencers.data) return [];

    let result = influencers.data.filter((inf) => {
      const searchLower = search.toLowerCase();
      return (
        inf.username.toLowerCase().includes(searchLower) ||
        inf.fullName.toLowerCase().includes(searchLower)
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "followers-desc":
          return b.followers - a.followers;
        case "followers-asc":
          return a.followers - b.followers;
        case "posts-desc":
          return b.postsCount - a.postsCount;
        case "posts-asc":
          return a.postsCount - b.postsCount;
        case "name-asc":
          return a.fullName.localeCompare(b.fullName);
        default:
          return 0;
      }
    });

    return result;
  }, [influencers.data, search, sortBy]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Influenceurs</h1>
            <p className="text-sm text-muted-foreground">
              {influencers.data?.length || 0} influenceurs scrapés
            </p>
          </div>
        </div>
        <Link to="/scrape" className={buttonVariants({ variant: "default" })}>
          <Plus className="h-4 w-4 mr-2" />
          Scraper un influenceur
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[200px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="followers-desc">Followers (décroissant)</SelectItem>
            <SelectItem value="followers-asc">Followers (croissant)</SelectItem>
            <SelectItem value="posts-desc">Posts (décroissant)</SelectItem>
            <SelectItem value="posts-asc">Posts (croissant)</SelectItem>
            <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {influencers.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {influencers.error && (
        <div className="text-center py-12 text-destructive">
          Erreur: {influencers.error.message}
        </div>
      )}

      {filteredAndSortedInfluencers.length === 0 && !influencers.isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun influenceur trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {search
              ? "Aucun résultat pour cette recherche"
              : "Commencez par scraper un influenceur"}
          </p>
          {!search && (
            <Link to="/scrape" className={buttonVariants({ variant: "default" })}>
              <Plus className="h-4 w-4 mr-2" />
              Scraper un influenceur
            </Link>
          )}
        </div>
      )}

      {filteredAndSortedInfluencers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedInfluencers.map((inf) => (
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
    </div>
  );
}
