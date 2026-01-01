import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { PartnershipTable } from "@/components/partnership-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BadgeCheck, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/influencers/$id")({
  component: InfluencerPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

function InfluencerPage() {
  const { id } = Route.useParams();

  const influencer = useQuery(trpc.influencer.get.queryOptions({ id }));
  const posts = useQuery(trpc.post.list.queryOptions({ influencerId: id, limit: 100 }));

  const isLoading = influencer.isLoading || posts.isLoading;
  const error = influencer.error || posts.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-destructive">Erreur: {error.message}</p>
        </div>
      </div>
    );
  }

  const inf = influencer.data!;
  const postList = posts.data ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link
        to="/influencers"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Link>

      <div className="flex items-start gap-6 my-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={inf.profilePicUrl ?? undefined} alt={inf.username} />
          <AvatarFallback className="text-2xl">
            {inf.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{inf.fullName}</h1>
            {inf.isVerified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
            {inf.isBusiness && <Badge variant="secondary">Business</Badge>}
          </div>

          <p className="text-muted-foreground mb-3">@{inf.username}</p>

          {inf.bio && (
            <p className="text-sm max-w-lg whitespace-pre-wrap mb-4">{inf.bio}</p>
          )}

          <div className="flex items-center gap-6 text-sm">
            <Stat value={inf.followers} label="followers" />
            <Stat value={inf.following} label="following" />
            <Stat value={inf.postsCount} label="posts" />
          </div>
        </div>
      </div>

      {postList.length > 0 ? (
        <PartnershipTable posts={postList} />
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          Aucun post trouvé pour cet influenceur
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const formatted =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : value >= 1_000
        ? `${(value / 1_000).toFixed(1)}K`
        : value.toString();

  return (
    <div>
      <span className="font-bold">{formatted}</span>
      <span className="text-muted-foreground ml-1">{label}</span>
    </div>
  );
}
