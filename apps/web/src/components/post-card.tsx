import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ExternalLink, Heart, MessageCircle, Users, AtSign, Megaphone } from "lucide-react";

interface PostCardProps {
  id: string;
  shortcode: string;
  url: string;
  caption: string | null;
  date: Date;
  likes: number;
  commentsCount: number;
  coauthors: string[] | null;
  captionMentions?: string[] | null;
  taggedUsers?: string[] | null;
  isSponsored: boolean;
  sponsorUsers?: string[] | null;
  onViewDetails?: () => void;
}

export function PostCard({
  url,
  caption,
  date,
  likes,
  commentsCount,
  coauthors,
  captionMentions,
  taggedUsers,
  isSponsored,
  sponsorUsers,
  onViewDetails,
}: PostCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const hasCoauthors = coauthors && coauthors.length > 0;
  const hasMentions = captionMentions && captionMentions.length > 0;
  const hasTaggedUsers = taggedUsers && taggedUsers.length > 0;
  const hasSponsors = sponsorUsers && sponsorUsers.length > 0;

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <time className="text-xs text-muted-foreground">
            {new Date(date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
          <div className="flex items-center gap-2">
            {isSponsored && (
              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                <Megaphone className="h-3 w-3 mr-1" />
                Sponsorisé
              </Badge>
            )}
          </div>
        </div>

        {caption && (
          <p className="text-sm line-clamp-3 mb-3">{caption}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatNumber(likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatNumber(commentsCount)}
          </span>
        </div>

        <div className="space-y-2">
          {hasCoauthors && (
            <div className="flex flex-wrap gap-1">
              <Users className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
              {coauthors.map((author) => (
                <Badge key={author} variant="outline" className="text-xs text-blue-600 border-blue-200">
                  @{author}
                </Badge>
              ))}
            </div>
          )}

          {hasMentions && (
            <div className="flex flex-wrap gap-1">
              <AtSign className="h-3.5 w-3.5 text-purple-500 mt-0.5" />
              {captionMentions.slice(0, 5).map((mention) => (
                <Badge key={mention} variant="outline" className="text-xs text-purple-600 border-purple-200">
                  {mention}
                </Badge>
              ))}
              {captionMentions.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{captionMentions.length - 5}
                </Badge>
              )}
            </div>
          )}

          {hasTaggedUsers && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground">Tagués:</span>
              {taggedUsers.slice(0, 3).map((user) => (
                <Badge key={user} variant="secondary" className="text-xs">
                  @{user}
                </Badge>
              ))}
              {taggedUsers.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{taggedUsers.length - 3}
                </Badge>
              )}
            </div>
          )}

          {hasSponsors && (
            <div className="flex flex-wrap gap-1">
              <Megaphone className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
              {sponsorUsers.map((sponsor) => (
                <Badge key={sponsor} className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  {sponsor}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {onViewDetails && (
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
            Détails
          </Button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </CardFooter>
    </Card>
  );
}
