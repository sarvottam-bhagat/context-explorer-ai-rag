import { ContentData } from "@/components/ContentViewer";

export interface AnalysisResult {
  summary: string;
  keyFindings: string[];
  detailedAnalysis: string;
  sources: string[];
  recommendations: string[];
}

export async function analyzeContent(contents: ContentData[], topic: string): Promise<AnalysisResult> {
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set your API key first.');
  }

  // Prepare the content for analysis
  const contentText = contents.map(content => `
Title: ${content.title}
URL: ${content.url}
Published: ${content.publishedTime || 'Not specified'}

Content:
${content.content}

---
  `).join('\n');

  const prompt = `You are a research analyst. Analyze the following research materials on the topic "${topic}" and provide a comprehensive research report.

Research Materials:
${contentText}

Please provide a detailed analysis in the following structure:
1. EXECUTIVE SUMMARY (2-3 paragraphs)
2. KEY FINDINGS (5-7 bullet points of the most important insights)
3. DETAILED ANALYSIS (comprehensive analysis organized by themes/subtopics)
4. SOURCES SUMMARY (brief description of each source and its contribution)
5. RECOMMENDATIONS (actionable insights and next steps)

Make sure to:
- Synthesize information across all sources
- Identify patterns, contradictions, and consensus
- Provide critical analysis, not just summary
- Reference specific sources when making claims
- Organize findings thematically
- Be thorough but concise`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert research analyst who synthesizes multiple sources to create comprehensive, insightful research reports.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    // Parse the structured response
    const sections = analysisText.split(/(?:^|\n)(?=\d+\.\s+[A-Z\s]+(?::|$))/m);
    
    return {
      summary: extractSection(analysisText, 'EXECUTIVE SUMMARY', 'KEY FINDINGS') || 'Analysis completed',
      keyFindings: extractBulletPoints(analysisText, 'KEY FINDINGS', 'DETAILED ANALYSIS'),
      detailedAnalysis: extractSection(analysisText, 'DETAILED ANALYSIS', 'SOURCES SUMMARY') || analysisText,
      sources: contents.map(c => `${c.title} - ${c.url}`),
      recommendations: extractBulletPoints(analysisText, 'RECOMMENDATIONS') || []
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error('Failed to analyze content. Please try again.');
  }
}

function extractSection(text: string, startMarker: string, endMarker?: string): string {
  const startRegex = new RegExp(`\\d+\\.\\s+${startMarker}[^\\n]*\\n`, 'i');
  const startMatch = text.match(startRegex);
  
  if (!startMatch) return '';
  
  const startIndex = startMatch.index! + startMatch[0].length;
  
  if (endMarker) {
    const endRegex = new RegExp(`\\d+\\.\\s+${endMarker}`, 'i');
    const endMatch = text.slice(startIndex).match(endRegex);
    
    if (endMatch) {
      return text.slice(startIndex, startIndex + endMatch.index!).trim();
    }
  }
  
  return text.slice(startIndex).trim();
}

function extractBulletPoints(text: string, startMarker: string, endMarker?: string): string[] {
  const section = extractSection(text, startMarker, endMarker);
  
  const bulletPoints = section
    .split('\n')
    .filter(line => line.trim().match(/^[-•*]\s+/))
    .map(line => line.trim().replace(/^[-•*]\s+/, ''));
    
  return bulletPoints.length > 0 ? bulletPoints : section.split('\n').filter(line => line.trim().length > 0);
}