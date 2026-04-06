import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AnalyzeService } from '../core/services/analyze.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private analyzeService = inject(AnalyzeService);
  private authService   = inject(AuthService);
  private router        = inject(Router);

  currentUser = this.authService.getCurrentUser();
  greeting    = '';
  quickUrl    = '';

  // Stats
  totalAnalyzed  = 0;
  avgRealScore   = 0;
  avgPropScore   = 0;
  avgTrustScore  = 0;
  todayCount     = 0;
  highRiskCount  = 0;

  // Recent history (last 5)
  recentItems: any[] = [];

  ngOnInit() {
    this.setGreeting();
    this.loadStats();
  }

  setGreeting() {
    const h = new Date().getHours();
    if (h < 12)      this.greeting = 'Good Morning';
    else if (h < 17) this.greeting = 'Good Afternoon';
    else             this.greeting = 'Good Evening';
  }

  loadStats() {
    const history = this.analyzeService.getHistory();
    this.totalAnalyzed = history.length;

    if (history.length > 0) {
      this.avgRealScore  = Math.round(history.reduce((s, i) => s + i.realPercent, 0) / history.length);
      this.avgPropScore  = Math.round(history.reduce((s, i) => s + i.propagandaPercent, 0) / history.length);
      this.avgTrustScore = Math.round(history.reduce((s, i) => s + i.trustScore, 0) / history.length);
      this.highRiskCount = history.filter(i => i.propagandaPercent > 60).length;

      const today = new Date().toLocaleDateString();
      this.todayCount = history.filter(i => i.date === today).length;
    }

    this.recentItems = history.slice(0, 5);
  }

  goToAnalyzer() {
    this.router.navigate(['/analyzer']);
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Real':       return 'status-real';
      case 'Propaganda': return 'status-prop';
      default:           return 'status-mixed';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }
}