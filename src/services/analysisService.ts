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

  const prompt = `You are a research analyst and writer. Create a comprehensive, detailed research article on "${topic}" using the following research materials. Write this as a full-length article that could be published in an academic journal or professional publication.

Research Materials:
${contentText}

Write a detailed research article with the following structure:

# ${topic}: A Comprehensive Analysis

## Introduction
- Provide context and importance of the topic
- Preview main themes and findings
- Set the scope of analysis (2-3 paragraphs)

## Background and Context
- Historical context and evolution
- Current state of the field
- Key challenges and opportunities (3-4 paragraphs)

## Key Findings and Insights
- Present 5-8 major findings with detailed explanations
- Support each finding with evidence from sources
- Include contradictions or debates in the field
- Use subheadings for different themes (4-6 paragraphs per finding)

## Detailed Analysis by Theme
- Organize findings into coherent themes
- Provide deep analysis of each theme
- Compare and contrast different perspectives
- Include specific examples and case studies (3-4 major themes, 4-5 paragraphs each)

## Implications and Future Directions
- Discuss practical implications
- Identify emerging trends
- Suggest areas for future research
- Address potential challenges (4-5 paragraphs)

## Conclusion
- Synthesize main insights
- Reinforce key messages
- Final thoughts on significance (2-3 paragraphs)

Writing Requirements:
- Write 3000-4000 words minimum
- Use academic but accessible language
- Include specific examples and quotes from sources
- Reference sources naturally throughout
- Maintain analytical depth throughout
- Create smooth transitions between sections
- Use varied sentence structure and engaging prose
- Be comprehensive but well-organized`;

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
      summary: analysisText.substring(0, 500) + '...', // First 500 chars as summary
      keyFindings: [], // Will be embedded in the full article
      detailedAnalysis: analysisText, // Full article content
      sources: contents.map(c => `${c.title} - ${c.url}`),
      recommendations: [] // Will be embedded in the full article
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