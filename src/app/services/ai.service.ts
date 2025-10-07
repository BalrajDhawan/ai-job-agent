import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface AnalysisResponse {
  summary: string;
  suggestions: string[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private endpoint = environment.apiUrl + '/analyze-jd';

  analyzeJD(text: string, apiKey: string): Observable<AnalysisResponse> {
    // Only allow Gemini API keys (starts with AIza)
    if (typeof apiKey !== 'string' || !apiKey.startsWith('AIza')) {
      return of({ summary: 'Invalid Gemini API key.', suggestions: [] });
    }

    // Gemini API endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `Summarize below job description in 500 words and provide resume bullet points(which aligns with JD):\n\n${text}`;

    // Use Observable for async fetch
    return new Observable<AnalysisResponse>(observer => {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [ { text: prompt } ]
            }
          ]
        })
      })
      .then(async res => {
        if (!res.ok) {
          observer.error('Gemini API error: ' + res.statusText);
          return;
        }
        const data = await res.json();
        // Parse Gemini response
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
        } catch (e) {
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
