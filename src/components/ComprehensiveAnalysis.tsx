import { useState } from "react";
import { X, FileText, Lightbulb, Target, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnalysisResult } from "@/services/analysisService";

interface ComprehensiveAnalysisProps {
  analysis: AnalysisResult | null;
  topic: string;
  onClose: () => void;
}

export function ComprehensiveAnalysis({ analysis, topic, onClose }: ComprehensiveAnalysisProps) {
  const [copied, setCopied] = useState(false);

  if (!analysis) return null;

  const handleCopy = async () => {
    try {
      const fullReport = `
# Deep Research Analysis: ${topic}

## Executive Summary
${analysis.summary}

## Key Findings
${analysis.keyFindings.map(finding => `• ${finding}`).join('\n')}

## Detailed Analysis
${analysis.detailedAnalysis}

## Sources
${analysis.sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}

## Recommendations
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}
      `.trim();
      
      await navigator.clipboard.writeText(fullReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy analysis:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] bg-content-background">
        <CardHeader className="border-b bg-card sticky top-0 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl leading-tight mb-2 text-research-blue flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Deep Research Analysis: {topic}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {analysis.sources.length} Sources Analyzed
                </Badge>
                <Badge variant="secondary">
                  {analysis.keyFindings.length} Key Findings
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-3 w-3" />
                    Copy Report
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(90vh-12rem)]">
            <div className="p-6 space-y-8">
              
              {/* Executive Summary */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-research-blue flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Executive Summary
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-reading-text leading-relaxed whitespace-pre-line">
                    {analysis.summary}
                  </p>
                </div>
              </section>

              <Separator />

              {/* Key Findings */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-research-blue flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Key Findings
                </h2>
                <div className="grid gap-3">
                  {analysis.keyFindings.map((finding, index) => (
                    <Card key={index} className="border-l-4 border-l-research-accent">
                      <CardContent className="p-4">
                        <p className="text-reading-text leading-relaxed">
                          {finding}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Detailed Analysis */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-research-blue">
                  Detailed Analysis
                </h2>
                <div className="prose prose-gray max-w-none">
                  <div className="text-reading-text leading-relaxed whitespace-pre-line">
                    {analysis.detailedAnalysis}
                  </div>
                </div>
              </section>

              <Separator />

              {/* Sources */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-research-blue flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Sources Analyzed
                </h2>
                <div className="grid gap-3">
                  {analysis.sources.map((source, index) => {
                    const [title, url] = source.split(' - ');
                    return (
                      <Card key={index} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-research-blue truncate">
                                {title}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {url}
                              </p>
                            </div>
                            <Badge variant="outline">
                              #{index + 1}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-research-blue flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recommendations
                    </h2>
                    <div className="grid gap-3">
                      {analysis.recommendations.map((recommendation, index) => (
                        <Card key={index} className="border-l-4 border-l-research-blue">
                          <CardContent className="p-4">
                            <p className="text-reading-text leading-relaxed">
                              {recommendation}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}