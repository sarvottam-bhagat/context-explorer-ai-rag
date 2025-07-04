import { useState, useEffect } from "react";
import { BookOpen, Sparkles, Brain, Settings, X } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults, SearchResult } from "@/components/SearchResults";
import { ContentViewer, ContentData } from "@/components/ContentViewer";
import { ComprehensiveAnalysis } from "@/components/ComprehensiveAnalysis";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchWithJina, readUrlWithJina } from "@/services/jinaService";
import { analyzeContent, AnalysisResult } from "@/services/analysisService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentContent, setCurrentContent] = useState<ContentData | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  const [fetchedContents, setFetchedContents] = useState<ContentData[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [resultsToAnalyze, setResultsToAnalyze] = useState<number>(5);
  const { toast } = useToast();

  useEffect(() => {
    // Set the user's OpenAI API key
    const userApiKey = "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";
    localStorage.setItem('openai_api_key', userApiKey);
    setApiKey(userApiKey);
    
    // Also check for any previously saved key as fallback
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey && savedApiKey !== userApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    setCurrentQuery(query);
    setFetchedContents([]); // Reset collected content for new search
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
      
      // Add to fetched contents for comprehensive analysis
      setFetchedContents(prev => {
        const exists = prev.some(c => c.url === content.url);
        if (!exists) {
          return [...prev, content];
        }
        return prev;
      });
      
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

  const handleComprehensiveAnalysis = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    if (fetchedContents.length === 0) {
      toast({
        title: "No content to analyze",
        description: "Please read some articles first before generating comprehensive analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeContent(fetchedContents, currentQuery);
      setAnalysisResult(analysis);
      toast({
        title: "Analysis completed",
        description: `Generated comprehensive analysis from ${fetchedContents.length} sources`,
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFetchAllAndAnalyze = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    if (searchResults.length === 0) {
      toast({
        title: "No search results",
        description: "Please search for a topic first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    const allContents: ContentData[] = [];
    
    try {
      // Fetch content from selected number of search results
      const resultsToFetch = Math.min(resultsToAnalyze, searchResults.length);
      for (let i = 0; i < resultsToFetch; i++) {
        const result = searchResults[i];
        try {
          const content = await readUrlWithJina(result.url);
          allContents.push(content);
          
          // Update progress
          toast({
            title: `Fetching content ${i + 1}/${resultsToFetch}`,
            description: `Reading: ${result.title.substring(0, 50)}...`,
          });
        } catch (error) {
          console.error(`Failed to fetch ${result.url}:`, error);
          // Continue with other URLs even if one fails
        }
      }

      if (allContents.length === 0) {
        throw new Error("Failed to fetch any content from the search results");
      }

      // Update fetched contents
      setFetchedContents(allContents);

      // Generate comprehensive analysis
      const analysis = await analyzeContent(allContents, currentQuery);
      setAnalysisResult(analysis);
      
      toast({
        title: "Analysis completed",
        description: `Generated comprehensive analysis from ${allContents.length} sources`,
      });
    } catch (error) {
      console.error("Bulk analysis failed:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseContent = () => {
    setCurrentContent(null);
  };

  const handleApiKeySet = (newApiKey: string) => {
    setApiKey(newApiKey);
    setShowApiKeyInput(false);
    toast({
      title: "API key saved",
      description: "You can now generate comprehensive analysis",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-cyber-blue" />
              <Sparkles className="h-4 w-4 text-cyber-orange" />
            </div>
            <h1 className="text-xl font-bold text-cyber-blue">
              Cyber Research RAG
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
            <h2 className="text-3xl font-bold text-cyber-blue mb-3">
              Discover The Future
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter keywords or topics to discover relevant sources and dive deep into comprehensive content analysis.
            </p>
          </div>
          
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {/* Comprehensive Analysis Section */}
        {fetchedContents.length > 0 && (
          <div className="mb-8">
            <Card className="border-2 border-cyber-orange/20 bg-gradient-to-r from-cyber-blue/5 to-cyber-orange/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyber-blue">
                  <Brain className="h-5 w-5" />
                  Comprehensive Analysis
                  <Badge variant="secondary" className="ml-2">
                    {fetchedContents.length} Sources Ready
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <p className="text-sm text-muted-foreground">
                    Generate a detailed research report analyzing all fetched content:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fetchedContents.map((content, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {content.title.substring(0, 50)}...
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleComprehensiveAnalysis}
                    disabled={isAnalyzing}
                    className="bg-cyber-blue hover:bg-primary-hover"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Generate Analysis
                      </>
                    )}
                  </Button>
                  
                  {!apiKey && (
                    <Button
                      variant="outline"
                      onClick={() => setShowApiKeyInput(true)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Setup API Key
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Search Results ({searchResults.length})
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="results-count" className="text-sm">
                        Analyze:
                      </Label>
                      <Input
                        id="results-count"
                        type="number"
                        min="1"
                        max={Math.min(10, searchResults.length)}
                        value={resultsToAnalyze}
                        onChange={(e) => setResultsToAnalyze(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                        className="w-16 h-8 text-center"
                      />
                      <span className="text-sm text-muted-foreground">
                        of {searchResults.length} results
                      </span>
                    </div>
                    <Button
                      onClick={handleFetchAllAndAnalyze}
                      disabled={isAnalyzing}
                      className="bg-cyber-blue hover:bg-primary-hover"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2" />
                          Fetching & Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Fetch & Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <SearchResults
                  results={searchResults}
                  onReadContent={handleReadContent}
                  isLoadingContent={isLoadingContent}
                  loadingUrl={loadingUrl}
                />
              </>
            )}
          </div>
        )}

        {/* Welcome State */}
        {!hasSearched && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <BookOpen className="h-16 w-16 text-cyber-blue/20" />
                  <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-cyber-orange" />
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

      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative">
            <ApiKeyInput
              onApiKeySet={handleApiKeySet}
              currentApiKey={apiKey}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeyInput(false)}
              className="absolute -top-2 -right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Comprehensive Analysis Modal */}
      <ComprehensiveAnalysis
        analysis={analysisResult}
        topic={currentQuery}
        onClose={() => setAnalysisResult(null)}
      />
    </div>
  );
};

export default Index;