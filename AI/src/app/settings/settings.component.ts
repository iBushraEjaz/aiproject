import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AnalyzeService } from '../core/services/analyze.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  user = { name: '', email: '' };
  apiUrl = 'http://localhost:8000';
  historyCount = 0;
  savedMsg = '';
  cleared = false;

  constructor(
    private authService: AuthService,
    private analyzeService: AnalyzeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const u = this.authService.getCurrentUser();
    if (u) this.user = { name: u.name, email: u.email };
    this.historyCount = this.analyzeService.getHistory().length;
    const saved = localStorage.getItem('seogen_api_url');
    if (saved) this.apiUrl = saved;
  }

  saveApiUrl(): void {
    localStorage.setItem('seogen_api_url', this.apiUrl);
    this.savedMsg = 'Saved!';
    setTimeout(() => this.savedMsg = '', 2500);
  }

  clearHistory(): void {
    this.analyzeService.clearHistory();
    this.historyCount = 0;
    this.cleared = true;
  }

  logout(): void {
    this.authService.logout();
  }
}
