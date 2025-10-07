import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AnalysisResponse {
  summary: string;
  suggestions: string[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  /**
   * Calls Gemini API to analyze job description and return summary and suggestions.
   * @param text Job description text
   * @param apiKey Gemini API key
   */
  analyzeJD(text: string, apiKey: string): Observable<AnalysisResponse> {
    if (typeof apiKey !== 'string' || !apiKey.startsWith('AIza')) {
      return of({ summary: 'Invalid Gemini API key.', suggestions: [] });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `Summarize below job description in 500 words and provide resume bullet points (which align with JD):\n\n${text}`;

    return new Observable<AnalysisResponse>(observer => {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [ { text: prompt } ] }
          ]
        })
      })
      .then(async res => {
        if (!res.ok) {
          observer.error('Gemini API error: ' + res.statusText);
          return;
        }
        const data = await res.json();
        const textResponse: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let summary = '';
        let suggestions: string[] = [];
        try {
          const [summaryPart, ...bullets] = textResponse.split(/\n- |\n• |\n\d+\. /);
          summary = summaryPart.trim();
          suggestions = textResponse
            .split(/\n- |\n• |\n\d+\. /)
            .slice(1)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        } catch {
          summary = textResponse || '';
        }
        observer.next({ summary, suggestions });
        observer.complete();
      })
      .catch(err => {
        observer.error('Network or Gemini API error: ' + err);
      });
    });
  }
}
