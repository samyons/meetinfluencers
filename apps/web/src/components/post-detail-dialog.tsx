import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Heart, MessageCircle, Users, AtSign, Megaphone, Tag, Calendar } from "lucide-react";

interface PostDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
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
    isVideo?: boolean;
  } | null;
}

export function PostDetailDialog({ open, onOpenChange, post }: PostDetailDialogProps) {
  if (!post) return null;

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const hasCoauthors = post.coauthors && post.coauthors.length > 0;
  const hasMentions = post.captionMentions && post.captionMentions.length > 0;
  const hasTaggedUsers = post.taggedUsers && post.taggedUsers.length > 0;
  const hasSponsors = post.sponsorUsers && post.sponsorUsers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails du post</span>
            <div className="flex items-center gap-2">
              {post.isSponsored && (
                <Badge className="bg-amber-500">
                  <Megaphone className="h-3 w-3 mr-1" />
                  Sponsorisé
                </Badge>
              )}
              {post.isVideo && (
                <Badge variant="secondary">Vidéo</Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-medium">{formatNumber(post.likes)}</span>
                <span className="text-muted-foreground">likes</span>
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <span className="font-medium">{formatNumber(post.commentsCount)}</span>
                <span className="text-muted-foreground">commentaires</span>
              </span>
            </div>

            <Separator />

            {post.caption && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Caption</h4>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                  {post.caption}
                </p>
              </div>
            )}

            {hasCoauthors && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Co-auteurs ({post.coauthors!.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {post.coauthors!.map((author) => (
                    <Badge key={author} variant="outline" className="text-blue-600 border-blue-200">
                      @{author}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {hasMentions && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-purple-500" />
                  Mentions ({post.captionMentions!.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {post.captionMentions!.map((mention) => (
                    <Badge key={mention} variant="outline" className="text-purple-600 border-purple-200">
                      {mention}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {hasTaggedUsers && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-500" />
                  Utilisateurs tagués ({post.taggedUsers!.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {post.taggedUsers!.map((user) => (
                    <Badge key={user} variant="secondary">
                      @{user}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {hasSponsors && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-amber-500" />
                  Sponsors ({post.sponsorUsers!.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {post.sponsorUsers!.map((sponsor) => (
                    <Badge key={sponsor} className="bg-amber-100 text-amber-700 border-amber-200">
                      {sponsor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "default" })}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir sur Instagram
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
