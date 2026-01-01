import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Users } from "lucide-react";

interface InfluencerCardProps {
  id: string;
  username: string;
  fullName: string;
  followers: number;
  postsCount: number;
  profilePicUrl: string | null;
  isVerified: boolean;
}

export function InfluencerCard({
  id,
  username,
  fullName,
  followers,
  postsCount,
  profilePicUrl,
  isVerified,
}: InfluencerCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Link to="/influencers/$id" params={{ id }}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profilePicUrl || undefined} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{fullName}</h3>
                {isVerified && (
                  <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{username}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {formatNumber(followers)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {postsCount} posts
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
