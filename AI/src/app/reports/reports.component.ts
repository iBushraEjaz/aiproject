import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyzeService, AnalyzeResult } from '../core/services/analyze.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  history: AnalyzeResult[] = [];

  totalAnalyzed = 0;
  realCount = 0;
  propagandaCount = 0;
  mixedCount = 0;
  avgTrust = 0;
  avgReal = 0;
  avgPropaganda = 0;

  constructor(private analyzeService: AnalyzeService) {}

  ngOnInit(): void {
    this.history = this.analyzeService.getHistory();
    this.computeStats();
  }

  computeStats(): void {
    const h = this.history;
    this.totalAnalyzed = h.length;
    this.realCount = h.filter(i => i.status === 'Real').length;
    this.propagandaCount = h.filter(i => i.status === 'Propaganda').length;
    this.mixedCount = h.filter(i => i.status === 'Mixed').length;
    this.avgTrust = h.length ? Math.round(h.reduce((s, i) => s + i.trustScore, 0) / h.length) : 0;
    this.avgReal = h.length ? Math.round(h.reduce((s, i) => s + i.realPercent, 0) / h.length) : 0;
    this.avgPropaganda = h.length ? Math.round(h.reduce((s, i) => s + i.propagandaPercent, 0) / h.length) : 0;
  }

  getStatusClass(status: string): string {
    if (status === 'Real') return 'tag-real';
    if (status === 'Propaganda') return 'tag-prop';
    return 'tag-mixed';
  }

  clearAll(): void {
    this.analyzeService.clearHistory();
    this.history = [];
    this.computeStats();
  }

  printReport(): void {
    window.print();
  }

  get realPercent(): number {
    return this.totalAnalyzed ? Math.round((this.realCount / this.totalAnalyzed) * 100) : 0;
  }
  get propPercent(): number {
    return this.totalAnalyzed ? Math.round((this.propagandaCount / this.totalAnalyzed) * 100) : 0;
  }
  get mixedPercent(): number {
    return this.totalAnalyzed ? Math.round((this.mixedCount / this.totalAnalyzed) * 100) : 0;
  }
}
