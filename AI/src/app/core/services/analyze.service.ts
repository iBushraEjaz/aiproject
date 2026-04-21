import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap, forkJoin } from 'rxjs';

// ---------- API response shape (from FastAPI) ----------
export interface ApiAnalyzeResponse {
  label: string;
  label_id: number;
  confidence: number;
  probabilities: {
    'non-propaganda': number;
    'propaganda': number;
    'unknown': number;
  };
  flagged_phrases: string[];
  detected_techniques: { [technique: string]: string[] };
}

export interface ApiBacklinkResponse {
  total_backlinks: number;
  unique_referring_domains: number;
  propaganda_sources: number;
  credible_sources: number;
  unknown_sources: number;
  dark_web_links: number;
  nofollow_ratio: number;
  top_referring_domains: string[];
  propaganda_referring_domains: string[];
  credible_referring_domains: string[];
  network_propaganda_score: number;
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
  flaggedPhrases: string[];
  detectedTechniques: { [technique: string]: string[] };
  apiLabel: string;
  // Network / backlink fields
  backlinkCount: number;
  domainAuthority: number;
  trustScore: number;
  networkPropagandaScore: number;
  propagandaSources: number;
  credibleSources: number;
  darkWebLinks: number;
  propagandaReferringDomains: string[];
  combinedScore: number;
  verdict: string;
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
    const analyze$ = (resolvedText: string, backlink?: ApiBacklinkResponse): Observable<AnalyzeResult> =>
      this.http
        .post<ApiAnalyzeResponse>(`${this.API_BASE}/api/analyze`, { text: resolvedText })
        .pipe(
          map((res) => this.mapApiResponse(res, url, resolvedText, backlink)),
          catchError((err) => {
            console.error('API error, falling back to mock:', err);
            return of(this.mockAnalyze(url || text));
          }),
        );

    // If URL mode, fetch article text + backlinks in parallel then analyze
    if (url) {
      return forkJoin({
        fetched: this.http.post<{ url: string; text: string; title: string }>(
          `${this.API_BASE}/api/fetch-url`, { url }
        ).pipe(catchError(() => of(null))),
        backlink: this.http.post<ApiBacklinkResponse>(
          `${this.API_BASE}/api/backlinks`, { url }
        ).pipe(catchError(() => of(null))),
      }).pipe(
        switchMap(({ fetched, backlink }) => {
          if (!fetched || !fetched.text || fetched.text.trim().length < 50) {
            throw new Error('Could not extract enough content from this URL. The site may block scrapers or require JavaScript. Try pasting the article text directly.');
          }
          return analyze$(fetched.text, backlink ?? undefined);
        }),
        catchError((err) => {
          const msg = err?.error?.detail || err?.message || 'Could not fetch URL. The site may block scrapers. Try pasting the article text directly.';
          throw new Error(msg);
        }),
      );
    }

    return analyze$(text);
  }

  // ---- Map API response to frontend model ----
  private mapApiResponse(
    res: ApiAnalyzeResponse,
    url: string,
    text: string,
    backlink?: ApiBacklinkResponse,
  ): AnalyzeResult {
    const propagandaProb = res.probabilities['propaganda'] ?? 0;
    const realProb       = res.probabilities['non-propaganda'] ?? 0;

    const propagandaPercent = Math.round(propagandaProb * 100);
    const realPercent       = Math.round(realProb * 100);

    // Combined score: 60% content + 40% network (if backlink data available)
    const networkScore = backlink?.network_propaganda_score ?? null;
    const combinedPropaganda = networkScore !== null
      ? Math.round((propagandaProb * 0.6 + networkScore * 0.4) * 100)
      : propagandaPercent;
    const combinedReal = 100 - combinedPropaganda;

    let status: 'Real' | 'Propaganda' | 'Mixed';
    if (combinedReal > 70)        status = 'Real';
    else if (combinedPropaganda > 70) status = 'Propaganda';
    else                          status = 'Mixed';

    // Verdict explanation
    let verdict = '';
    if (networkScore !== null) {
      const contentLean = propagandaPercent > 50 ? 'propaganda' : 'credible';
      const networkLean = networkScore > 0.3 ? 'propaganda' : 'credible';
      if (contentLean !== networkLean)
        verdict = `Content-leaning ${contentLean} but network-leaning ${networkLean}`;
      else
        verdict = `Both content and network lean ${contentLean}`;
    }

    const result: AnalyzeResult = {
      url: url || '(direct text input)',
      text,
      date: new Date().toLocaleDateString(),
      realPercent: combinedReal,
      propagandaPercent: combinedPropaganda,
      confidence: Math.round(res.confidence * 100),
      status,
      apiLabel: res.label,
      details: [
        `Model prediction: ${res.label}`,
        `Confidence: ${(res.confidence * 100).toFixed(1)}%`,
        `Content — Non-propaganda: ${(realProb * 100).toFixed(1)}%`,
        `Content — Propaganda: ${(propagandaProb * 100).toFixed(1)}%`,
        networkScore !== null ? `Network propaganda score: ${(networkScore * 100).toFixed(1)}%` : 'Network analysis: not available for this URL',
        networkScore !== null ? `Combined score (60% content + 40% network): ${combinedPropaganda}% propaganda` : '',
        'Analyzed using mBERT multilingual model',
      ].filter(Boolean),
      flaggedPhrases: res.flagged_phrases ?? [],
      detectedTechniques: res.detected_techniques ?? {},
      backlinkCount: backlink?.total_backlinks ?? 0,
      domainAuthority: combinedReal,
      trustScore: Math.round(res.confidence * 100),
      networkPropagandaScore: Math.round((networkScore ?? 0) * 100),
      propagandaSources: backlink?.propaganda_sources ?? 0,
      credibleSources: backlink?.credible_sources ?? 0,
      darkWebLinks: backlink?.dark_web_links ?? 0,
      propagandaReferringDomains: backlink?.propaganda_referring_domains ?? [],
      combinedScore: combinedPropaganda,
      verdict,
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
      flaggedPhrases: [],
      details: [
        '⚠ Backend API is not reachable — showing mock data',
      ],
      backlinkCount: 0,
      domainAuthority: 0,
      trustScore: 0,
      networkPropagandaScore: 0,
      propagandaSources: 0,
      credibleSources: 0,
      darkWebLinks: 0,
      propagandaReferringDomains: [],
      combinedScore: propagandaPercent,
      verdict: '',
      detectedTechniques: {},
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