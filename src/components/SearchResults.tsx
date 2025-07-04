import { ExternalLink, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  date?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  onReadContent: (url: string, title: string) => void;
  isLoadingContent?: boolean;
  loadingUrl?: string;
}

export function SearchResults({ results, onReadContent, isLoadingContent, loadingUrl }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No results found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Search Results ({results.length})
        </h2>
      </div>
      
      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow border-l-4 border-l-research-accent">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight mb-2 text-research-blue">
                    {result.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{result.url}</span>
                    {result.date && (
                      <>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{result.date}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  #{index + 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-base leading-relaxed mb-4">
                {result.description}
              </CardDescription>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReadContent(result.url, result.title)}
                  disabled={isLoadingContent}
                  className="flex-1 sm:flex-none"
                >
                  {isLoadingContent && loadingUrl === result.url ? (
                    <>
                      <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-2" />
                      Reading...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-3 w-3" />
                      Read Full Content
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(result.url, '_blank')}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Open
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}