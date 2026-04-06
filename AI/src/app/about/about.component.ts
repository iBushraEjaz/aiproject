import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  cards = [
    { icon: 'bi-cpu-fill', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', title: 'AI-Powered Analysis', desc: 'Fine-tuned mBERT model trained on 30,000+ samples detects propaganda with high accuracy across 104 languages.' },
    { icon: 'bi-globe2', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', title: 'Multilingual Support', desc: 'Built on bert-base-multilingual-cased, supporting analysis across 104 languages for truly global coverage.' },
    { icon: 'bi-lightning-charge-fill', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', title: 'Real-Time Processing', desc: 'FastAPI backend delivers sub-second inference, enabling seamless integration with any frontend or pipeline.' },
    { icon: 'bi-shield-fill-check', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', title: 'Transparent Scoring', desc: 'Every result includes confidence scores and probability breakdowns so you can understand the model reasoning.' },
    { icon: 'bi-code-slash', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', title: 'Open Architecture', desc: 'Angular + FastAPI + PyTorch stack — clean separation of concerns and easy to extend or self-host.' },
    { icon: 'bi-clock-history', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', title: 'Analysis History', desc: 'Every analysis is saved locally so you can track trends and review past results at any time.' },
  ];

  stats = [
    { val: '104', label: 'Languages Supported', icon: 'bi-globe2', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { val: '96.4%', label: 'Model Accuracy', icon: 'bi-graph-up-arrow', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { val: '<1s', label: 'Inference Time', icon: 'bi-lightning-charge-fill', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { val: '30K+', label: 'Training Samples', icon: 'bi-database-fill', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  upcomingFeatures = [
    { icon: 'bi-browser-chrome', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', title: 'Browser Extension', desc: 'Analyze articles and news seamlessly directly from your browser without switching tabs.' },
    { icon: 'bi-box-arrow-in-right', color: '#10b981', bg: 'rgba(16,185,129,0.1)', title: 'Developer API', desc: 'Integrate our core propaganda detection engine into your own products and workflows.' },
    { icon: 'bi-graph-up', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', title: 'Trend Analytics', desc: 'Identify large-scale misinformation campaigns with global tracking and historic trend views.' }
  ];
}
