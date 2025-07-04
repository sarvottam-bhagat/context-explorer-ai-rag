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

  const prompt = `You are an expert research analyst and writer. Create a comprehensive, well-structured research article on "${topic}" using the following research materials. Write this as a complete academic article with proper formatting, table of contents, and references.

Research Materials:
${contentText}

Please write a detailed research article following this EXACT structure:

# ${topic}: A Comprehensive Research Analysis

## Table of Contents
1. Introduction
2. Background and Context  
3. Current State of the Field
4. Key Findings and Insights
5. Detailed Analysis by Theme
6. Future Directions and Implications
7. Conclusion
8. References

---

## 1. Introduction
[Write 3-4 paragraphs introducing the topic, its importance, scope of this analysis, and what readers will learn]

## 2. Background and Context
[Write 4-5 paragraphs covering historical context, evolution of the field, and foundational concepts]

## 3. Current State of the Field
[Write 4-5 paragraphs about current developments, key players, recent advances, and ongoing challenges]

## 4. Key Findings and Insights
[Present 6-8 major findings with detailed explanations. Use subheadings for each finding:
### Finding 1: [Title]
[2-3 paragraphs explaining this finding with evidence from sources]

### Finding 2: [Title]
[2-3 paragraphs explaining this finding with evidence from sources]
... continue for all findings]

## 5. Detailed Analysis by Theme
[Organize the content into 3-4 major themes with deep analysis:
### Theme 1: [Title]
[4-5 paragraphs of detailed analysis, comparing perspectives, identifying patterns]

### Theme 2: [Title]
[4-5 paragraphs of detailed analysis, comparing perspectives, identifying patterns]
... continue for all themes]

## 6. Future Directions and Implications
[Write 4-5 paragraphs discussing practical implications, emerging trends, future research directions, and potential challenges]

## 7. Conclusion
[Write 3-4 paragraphs synthesizing main insights, reinforcing key messages, and final thoughts on significance]

## 8. References
[List all sources in this format:
1. Source Title - URL (Publication Date)
2. Source Title - URL (Publication Date)
... for all sources used]

Writing Requirements:
- Write 4000-5000 words minimum
- Use academic but accessible language
- Include specific examples and evidence from sources throughout
- Reference sources naturally in the text using phrases like "According to [Source Title]..." or "As noted in [Source Title]..."
- Create smooth transitions between sections
- Use varied sentence structure and engaging prose
- Be comprehensive, analytical, and well-organized
- Include direct quotes and specific data points where available
- Maintain scholarly tone while being readable`;

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
            content: 'You are an expert research analyst who creates comprehensive, well-structured research articles by analyzing multiple sources.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

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