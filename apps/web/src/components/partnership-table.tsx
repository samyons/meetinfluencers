import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Calendar,
  Users,
  AtSign,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";

interface Post {
  id: string;
  shortcode: string;
  url: string;
  caption: string | null;
  date: Date;
  isVideo: boolean;
  taggedUsers: string[] | null;
  captionMentions: string[] | null;
  coauthors: string[] | null;
  isSponsored: boolean;
  sponsorUsers: string[] | null;
}

interface PartnershipTableProps {
  posts: Post[];
}

export function PartnershipTable({ posts }: PartnershipTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const stats = useMemo(() => {
    const mentions = new Set<string>();
    const coauthors = new Set<string>();
    const tagged = new Set<string>();
    let sponsored = 0;

    for (const post of posts) {
      if (post.captionMentions) {
        for (const m of post.captionMentions) mentions.add(m);
      }
      if (post.coauthors) {
        for (const c of post.coauthors) coauthors.add(c);
      }
      if (post.taggedUsers) {
        for (const t of post.taggedUsers) tagged.add(t);
      }
      if (post.isSponsored) sponsored++;
    }

    return {
      totalPosts: posts.length,
      uniqueMentions: mentions.size,
      uniqueCoauthors: coauthors.size,
      uniqueTagged: tagged.size,
      sponsored,
    };
  }, [posts]);

  const columns = useMemo<ColumnDef<Post>[]>(
    () => [
      {
        id: "date",
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("date") as Date;
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(date), "dd MMM yyyy")}
            </div>
          );
        },
      },
      {
        id: "post",
        accessorKey: "shortcode",
        header: "Post",
        cell: ({ row }) => (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {row.original.shortcode}
          </a>
        ),
        enableSorting: false,
      },
      {
        id: "caption",
        accessorKey: "caption",
        header: "Caption",
        cell: ({ row }) => {
          const caption = row.getValue("caption") as string | null;
          if (!caption) {
            return <span className="text-muted-foreground italic">—</span>;
          }
          return (
            <p className="max-w-[300px] truncate text-sm" title={caption}>
              {caption}
            </p>
          );
        },
        enableSorting: false,
      },
      {
        id: "mentions",
        accessorFn: (row) => row.captionMentions?.join(" ") ?? "",
        header: () => (
          <div className="flex items-center gap-1.5">
            <AtSign className="h-3.5 w-3.5" />
            Mentions
          </div>
        ),
        cell: ({ row }) => {
          const mentions = row.original.captionMentions;
          if (!mentions?.length) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {mentions.slice(0, 3).map((mention) => (
                <Badge key={mention} variant="secondary" className="text-xs">
                  @{mention}
                </Badge>
              ))}
              {mentions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{mentions.length - 3}
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "coauthors",
        accessorFn: (row) => row.coauthors?.join(" ") ?? "",
        header: () => (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Coauteurs
          </div>
        ),
        cell: ({ row }) => {
          const coauthors = row.original.coauthors;
          if (!coauthors?.length) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {coauthors.slice(0, 3).map((coauthor) => (
                <Badge
                  key={coauthor}
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                >
                  {coauthor}
                </Badge>
              ))}
              {coauthors.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{coauthors.length - 3}
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "tagged",
        accessorFn: (row) => row.taggedUsers?.join(" ") ?? "",
        header: () => (
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Tagués
          </div>
        ),
        cell: ({ row }) => {
          const tagged = row.original.taggedUsers;
          if (!tagged?.length) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {tagged.slice(0, 3).map((user) => (
                <Badge
                  key={user}
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  {user}
                </Badge>
              ))}
              {tagged.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tagged.length - 3}
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "status",
        accessorFn: (row) => (row.isSponsored ? "sponsored" : "organic"),
        header: "Statut",
        cell: ({ row }) =>
          row.original.isSponsored ? (
            <Badge className="bg-amber-500 hover:bg-amber-600">Sponsorisé</Badge>
          ) : null,
        filterFn: (row, id, value) => {
          if (!value || value === "all") return true;
          return row.getValue(id) === value;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: posts,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalPosts}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.uniqueMentions}</p>
            <p className="text-xs text-muted-foreground">Mentions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.uniqueCoauthors}</p>
            <p className="text-xs text-muted-foreground">Coauteurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.uniqueTagged}</p>
            <p className="text-xs text-muted-foreground">Tagués</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.sponsored}</p>
            <p className="text-xs text-muted-foreground">Sponsorisés</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Rechercher dans les posts..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les posts</SelectItem>
            <SelectItem value="sponsored">Sponsorisés</SelectItem>
            <SelectItem value="organic">Organiques</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun post trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} post(s) sur {posts.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
