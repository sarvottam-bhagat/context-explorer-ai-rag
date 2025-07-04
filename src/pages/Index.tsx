import { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults, SearchResult } from "@/components/SearchResults";
import { ContentViewer, ContentData } from "@/components/ContentViewer";
import { searchWithJina, readUrlWithJina } from "@/services/jinaService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentContent, setCurrentContent] = useState<ContentData | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchWithJina(query);
      setSearchResults(results);
      toast({
        title: "Search completed",
        description: `Found ${results.length} results for "${query}"`,
      });
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReadContent = async (url: string, title: string) => {
    setIsLoadingContent(true);
    setLoadingUrl(url);
    try {
      const content = await readUrlWithJina(url);
      setCurrentContent(content);
      toast({
        title: "Content loaded",
        description: `Successfully loaded "${title}"`,
      });
    } catch (error) {
      console.error("Failed to read content:", error);
      toast({
        title: "Failed to load content",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoadingContent(false);
      setLoadingUrl("");
    }
  };

  const handleCloseContent = () => {
    setCurrentContent(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-research-blue" />
              <Sparkles className="h-4 w-4 text-research-accent" />
            </div>
            <h1 className="text-xl font-bold text-research-blue">
              Deep Research RAG
            </h1>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              AI-powered research assistant
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-research-blue mb-3">
              Research Any Topic
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter keywords or topics to discover relevant sources and dive deep into comprehensive content analysis.
            </p>
          </div>
          
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="mb-8">
            {isSearching ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="animate-spin h-5 w-5 border border-current border-t-transparent rounded-full" />
                  <span className="text-lg">Searching the web...</span>
                </div>
              </div>
            ) : (
              <SearchResults
                results={searchResults}
                onReadContent={handleReadContent}
                isLoadingContent={isLoadingContent}
                loadingUrl={loadingUrl}
              />
            )}
          </div>
        )}

        {/* Welcome State */}
        {!hasSearched && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <BookOpen className="h-16 w-16 text-research-blue/20" />
                  <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-research-accent" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Start Your Research Journey
              </h3>
              <p className="text-muted-foreground">
                Use the search bar above to explore topics like "machine learning", "climate change", or any subject you're curious about.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Content Viewer Modal */}
      <ContentViewer
        content={currentContent}
        onClose={handleCloseContent}
      />
    </div>
  );
};

export default Index;