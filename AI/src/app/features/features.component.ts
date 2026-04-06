import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css'],
})
export class FeaturesComponent {

  mainFeatures = [
    {
      icon: 'bi-link-45deg',
      title: 'Backlink Analysis',
      desc: 'Deep analysis of every backlink pointing to a website — dofollow, nofollow, referring domains, anchor texts and spam indicators.',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.2)',
      stats: [{ label: 'Links Tracked', val: '50K+' }, { label: 'Domains', val: '12K+' }],
      points: ['Total backlink count', 'Dofollow vs Nofollow ratio', 'Referring domain quality', 'Anchor text analysis'],
    },
    {
      icon: 'bi-shield-fill-x',
      title: 'Propaganda Detection',
      desc: 'AI-powered NLP engine that scans content for disinformation signals, biased language, emotional manipulation and false narratives.',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.2)',
      stats: [{ label: 'Accuracy', val: '99%' }, { label: 'Signals', val: '80+' }],
      points: ['Emotional manipulation score', 'Bias language detection', 'Source credibility check', 'False narrative patterns'],
    },
    {
      icon: 'bi-star-fill',
      title: 'Trust Score Engine',
      desc: 'Comprehensive trust scoring using domain age, SSL certificate, spam score, social signals and historical data to rate any website.',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.2)',
      stats: [{ label: 'Speed', val: '<2s' }, { label: 'Data Points', val: '40+' }],
      points: ['Domain authority rating', 'SSL & security checks', 'Historical reputation', 'Social signal analysis'],
    },
    {
      icon: 'bi-bar-chart-fill',
      title: 'Detailed Reports',
      desc: 'Generate comprehensive PDF and visual reports with charts, score breakdowns and actionable insights for any analyzed website.',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
      border: 'rgba(34,197,94,0.2)',
      stats: [{ label: 'Formats', val: '3' }, { label: 'Export', val: 'CSV/PDF' }],
      points: ['Visual score charts', 'PDF export support', 'CSV data download', 'Shareable report links'],
    },
    {
      icon: 'bi-clock-history',
      title: 'Analysis History',
      desc: 'Full searchable history of every URL analyzed. Filter by status, sort by score, paginate results and track changes over time.',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.2)',
      stats: [{ label: 'Storage', val: '∞' }, { label: 'Filters', val: '5+' }],
      points: ['Search & filter history', 'Status-based filtering', 'Sort by any metric', 'Full pagination support'],
    },
    {
      icon: 'bi-globe2',
      title: 'Domain Intelligence',
      desc: 'Full domain intelligence including WHOIS data, domain age, registrar info, hosting location and blacklist status checks.',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.1)',
      border: 'rgba(6,182,212,0.2)',
      stats: [{ label: 'Blacklists', val: '200+' }, { label: 'WHOIS', val: 'Live' }],
      points: ['WHOIS lookup', 'Domain age check', 'Hosting location', 'Blacklist monitoring'],
    },
  ];

  techStack = [
    { icon: 'bi-braces',           name: 'Angular 17',   desc: 'Frontend Framework', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
    { icon: 'bi-filetype-cs',      name: 'C# ASP.NET',   desc: 'Backend API',        color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
    { icon: 'bi-robot',            name: 'Python AI/ML', desc: 'NLP & Detection',    color: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
    { icon: 'bi-database',         name: 'SQL Server',   desc: 'Database',           color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
    { icon: 'bi-cpu',              name: 'TensorFlow',   desc: 'ML Model',           color: '#22c55e', glow: 'rgba(34,197,94,0.3)'  },
    { icon: 'bi-shield-check',     name: 'HTTPS / SSL',  desc: 'Security Layer',     color: '#06b6d4', glow: 'rgba(6,182,212,0.3)'  },
  ];

  howItWorks = [
    { step: '01', icon: 'bi-link-45deg',         title: 'Submit URL',       desc: 'Paste any website URL into the analyzer and click Analyze.', color: '#3b82f6' },
    { step: '02', icon: 'bi-cpu',                title: 'AI Processes',     desc: 'Engine crawls backlinks, checks domain data and runs NLP analysis.', color: '#8b5cf6' },
    { step: '03', icon: 'bi-bar-chart-fill',     title: 'Scores Calculated', desc: 'Real %, Propaganda %, Trust Score and Domain Authority generated.', color: '#f59e0b' },
    { step: '04', icon: 'bi-file-earmark-check', title: 'View Report',      desc: 'Get a full breakdown with visual scores, insights and export options.', color: '#22c55e' },
  ];

  stats = [
    { icon: 'bi-globe2',           val: '10K+',  label: 'Sites Analyzed',    color: '#3b82f6' },
    { icon: 'bi-shield-fill-check',val: '99%',   label: 'Detection Accuracy', color: '#22c55e' },
    { icon: 'bi-lightning-charge', val: '<2s',   label: 'Avg Analysis Time', color: '#f59e0b' },
    { icon: 'bi-people-fill',      val: '500+',  label: 'Active Users',      color: '#8b5cf6' },
  ];
}