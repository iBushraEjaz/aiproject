import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyzeService, AnalyzeResult } from '../core/services/analyze.service';

@Component({
  selector: 'app-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analyzer.component.html',
  styleUrls: ['./analyzer.component.css'],
})
export class AnalyzerComponent {
  private analyzeService = inject(AnalyzeService);

  url          = '';
  textInput    = '';
  inputMode    = signal<'url' | 'text'>('text');  // default to text mode
  isAnalyzing  = signal(false);
  result       = signal<AnalyzeResult | null>(null);
  errorMsg     = '';
  progress     = signal(0);
  backendOnline = signal<boolean | null>(null);

  constructor() {
    // Check backend health on init
    this.analyzeService.checkHealth().subscribe({
      next: (res) => this.backendOnline.set(res.model_loaded),
      error: () => this.backendOnline.set(false),
    });
  }

  toggleMode() {
    this.inputMode.update(m => m === 'url' ? 'text' : 'url');
    this.errorMsg = '';
  }

  onAnalyze() {
    const isTextMode = this.inputMode() === 'text';
    const input = isTextMode ? this.textInput.trim() : this.url.trim();

    if (!input) {
      this.errorMsg = isTextMode
        ? 'Please enter some text to analyze.'
        : 'Please enter a valid URL.';
      return;
    }

    if (!isTextMode && !this.url.startsWith('http')) {
      this.url = 'https://' + this.url;
    }

    this.errorMsg = '';
    this.result.set(null);
    this.isAnalyzing.set(true);
    this.progress.set(0);

    // Simulate progress while waiting for API
    const interval = setInterval(() => {
      this.progress.update(v => {
        if (v >= 90) { clearInterval(interval); return 90; }
        return v + Math.floor(Math.random() * 8) + 2;
      });
    }, 300);

    // Determine text to send to API
    const textToAnalyze = isTextMode ? this.textInput.trim() : this.url.trim();

    this.analyzeService.analyzeText(textToAnalyze, isTextMode ? '' : this.url).subscribe({
      next: (res) => {
        clearInterval(interval);
        this.progress.set(100);
        setTimeout(() => {
          this.result.set(res);
          this.isAnalyzing.set(false);
        }, 400);
      },
      error: (err) => {
        clearInterval(interval);
        this.progress.set(0);
        this.isAnalyzing.set(false);
        this.errorMsg = 'Analysis failed. Please check that the backend API is running.';
        console.error(err);
      },
    });
  }

  reset() {
    this.url = '';
    this.textInput = '';
    this.result.set(null);
    this.errorMsg = '';
    this.progress.set(0);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Real':       return '#22c55e';
      case 'Propaganda': return '#ef4444';
      default:           return '#f59e0b';
    }
  }

  getStatusBg(status: string): string {
    switch (status) {
      case 'Real':       return 'rgba(34,197,94,0.1)';
      case 'Propaganda': return 'rgba(239,68,68,0.1)';
      default:           return 'rgba(245,158,11,0.1)';
    }
  }

  getScoreLabel(score: number): string {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Moderate';
    if (score >= 30) return 'Low';
    return 'Critical';
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    if (score >= 30) return '#ef4444';
    return '#dc2626';
  }
}