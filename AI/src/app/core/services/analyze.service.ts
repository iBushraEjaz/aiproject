import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap } from 'rxjs';

// ---------- API response shape (from FastAPI) ----------
export interface ApiAnalyzeResponse {
  label: string;        // 'propaganda' | 'non-propaganda'
  label_id: number;
  confidence: number;
  probabilities: {
    'non-propaganda': number;
    'propaganda': number;
    'unknown': number;
  };
}

export interface ApiHealthResponse {
  status: string;
  model_loaded: boolean;
  model_name: string;
  device: string;
}

// ---------- Frontend display model ----------
export interface AnalyzeResult {
  url: string;
  text: string;
  date: string;
  realPercent: number;
  propagandaPercent: number;
  confidence: number;
  status: 'Real' | 'Propaganda' | 'Mixed';
  details: string[];
  apiLabel: string;
  // Backward-compatible fields (used by dashboard / history)
  backlinkCount: number;
  domainAuthority: number;
  trustScore: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyzeService {
  private http = inject(HttpClient);

  private readonly API_BASE = 'http://localhost:8000';
  private readonly HISTORY_KEY = 'seogen_history';

  // ---- Health check ----
  checkHealth(): Observable<ApiHealthResponse> {
    return this.http.get<ApiHealthResponse>(`${this.API_BASE}/api/health`);
  }

  // ---- Single text analysis (real API call) ----
  analyzeText(text: string, url: string = ''): Observable<AnalyzeResult> {
    const analyze$ = (resolvedText: string): Observable<AnalyzeResult> =>
      this.http
        .post<ApiAnalyzeResponse>(`${this.API_BASE}/api/analyze`, { text: resolvedText })
        .pipe(
          map((res) => this.mapApiResponse(res, url, resolvedText)),
          catchError((err) => {
            console.error('API error, falling back to mock:', err);
            return of(this.mockAnalyze(url || text));
          }),
        );

    // If URL mode, fetch article text first then analyze
    if (url) {
      return this.http
        .post<{ url: string; text: string; title: string }>(
          `${this.API_BASE}/api/fetch-url`,
          { url },
        )
        .pipe(
          catchError(() => of({ url, text, title: '' })),
          switchMap((fetched) => analyze$(fetched.text || text)),
        );
    }

    return analyze$(text);
  }

  // ---- Map API response to frontend model ----
  private mapApiResponse(
    res: ApiAnalyzeResponse,
    url: string,
    text: string,
  ): AnalyzeResult {
    const propagandaProb = res.probabilities['propaganda'] ?? 0;
    const realProb       = res.probabilities['non-propaganda'] ?? 0;

    const propagandaPercent = Math.round(propagandaProb * 100);
    const realPercent       = Math.round(realProb * 100);

    let status: 'Real' | 'Propaganda' | 'Mixed';
    if (realPercent > 70) {
      status = 'Real';
    } else if (propagandaPercent > 70) {
      status = 'Propaganda';
    } else {
      status = 'Mixed';
    }

    const result: AnalyzeResult = {
      url: url || '(direct text input)',
      text,
      date: new Date().toLocaleDateString(),
      realPercent,
      propagandaPercent,
      confidence: Math.round(res.confidence * 100),
      status,
      apiLabel: res.label,
      details: [
        `Model prediction: ${res.label}`,
        `Confidence: ${(res.confidence * 100).toFixed(1)}%`,
        `Non-propaganda probability: ${(realProb * 100).toFixed(1)}%`,
        `Propaganda probability: ${(propagandaProb * 100).toFixed(1)}%`,
        'Analyzed using mBERT multilingual model',
        'Content credibility evaluated by AI',
      ],
      backlinkCount: 0,
      domainAuthority: realPercent,
      trustScore: Math.round(res.confidence * 100),
    };

    this.saveToHistory(result);
    return result;
  }

  // ---- Mock fallback (used when API is down) ----
  private mockAnalyze(url: string): AnalyzeResult {
    const realPercent = Math.floor(Math.random() * 60) + 20;
    const propagandaPercent = 100 - realPercent;
    const result: AnalyzeResult = {
      url,
      text: '',
      date: new Date().toLocaleDateString(),
      realPercent,
      propagandaPercent,
      confidence: Math.floor(Math.random() * 30) + 70,
      status:
        realPercent > 70
          ? 'Real'
          : propagandaPercent > 70
            ? 'Propaganda'
            : 'Mixed',
      apiLabel: 'mock',
      details: [
        '⚠ Backend API is not reachable — showing mock data',
        'Backlink profile analyzed (mock)',
        'Domain age verified (mock)',
        'Content credibility checked (mock)',
      ],
      backlinkCount: Math.floor(Math.random() * 5000) + 100,
      domainAuthority: Math.floor(Math.random() * 100),
      trustScore: Math.floor(Math.random() * 100),
    };
    this.saveToHistory(result);
    return result;
  }

  // ---- History (localStorage) ----
  private saveToHistory(result: AnalyzeResult): void {
    const history = this.getHistory();
    history.unshift(result);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  }

  getHistory(): AnalyzeResult[] {
    const data = localStorage.getItem(this.HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  }

  clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }
}