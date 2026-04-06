import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyzeService, AnalyzeResult } from '../core/services/analyze.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit {
  private analyzeService = inject(AnalyzeService);

  allHistory  = signal<AnalyzeResult[]>([]);
  searchQuery = signal('');
  filterStatus = signal('All');
  sortBy      = signal('date');
  currentPage = signal(1);
  itemsPerPage = 8;

  statusOptions = ['All', 'Real', 'Mixed', 'Propaganda'];
  sortOptions   = [
    { value: 'date',       label: 'Latest First'     },
    { value: 'real_desc',  label: 'Real % High→Low'  },
    { value: 'real_asc',   label: 'Real % Low→High'  },
    { value: 'prop_desc',  label: 'Propaganda % High→Low' },
    { value: 'trust_desc', label: 'Trust Score High→Low'  },
  ];

  ngOnInit() {
    this.allHistory.set(this.analyzeService.getHistory());
  }

  // Filtered + sorted + searched list
  filtered = computed(() => {
    let list = [...this.allHistory()];

    // Search
    const q = this.searchQuery().toLowerCase();
    if (q) list = list.filter(i => i.url.toLowerCase().includes(q));

    // Filter by status
    if (this.filterStatus() !== 'All')
      list = list.filter(i => i.status === this.filterStatus());

    // Sort
    switch (this.sortBy()) {
      case 'real_desc':  list.sort((a,b) => b.realPercent - a.realPercent);         break;
      case 'real_asc':   list.sort((a,b) => a.realPercent - b.realPercent);         break;
      case 'prop_desc':  list.sort((a,b) => b.propagandaPercent - a.propagandaPercent); break;
      case 'trust_desc': list.sort((a,b) => b.trustScore - a.trustScore);           break;
      default:           break; // keep original order (latest first)
    }

    return list;
  });

  // Paginated
  paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filtered().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() =>
    Math.ceil(this.filtered().length / this.itemsPerPage)
  );

  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  // Stats
  totalCount    = computed(() => this.allHistory().length);
  realCount     = computed(() => this.allHistory().filter(i => i.status === 'Real').length);
  mixedCount    = computed(() => this.allHistory().filter(i => i.status === 'Mixed').length);
  propagandaCount = computed(() => this.allHistory().filter(i => i.status === 'Propaganda').length);
  avgTrust      = computed(() => {
    const h = this.allHistory();
    if (!h.length) return 0;
    return Math.round(h.reduce((s,i) => s + i.trustScore, 0) / h.length);
  });

  onSearch(val: string)       { this.searchQuery.set(val);    this.currentPage.set(1); }
  onFilterStatus(val: string) { this.filterStatus.set(val);   this.currentPage.set(1); }
  onSort(val: string)         { this.sortBy.set(val);         this.currentPage.set(1); }
  goToPage(p: number)         { this.currentPage.set(p); }

  clearHistory() {
    if (confirm('Clear all history? This cannot be undone.')) {
      this.analyzeService.clearHistory();
      this.allHistory.set([]);
    }
  }

  getStatusClass(s: string) {
    if (s === 'Real')       return 'tag-real';
    if (s === 'Propaganda') return 'tag-prop';
    return 'tag-mixed';
  }

  getStatusIcon(s: string) {
    if (s === 'Real')       return 'bi-shield-fill-check';
    if (s === 'Propaganda') return 'bi-shield-fill-x';
    return 'bi-shield-fill-exclamation';
  }

  getTrustColor(t: number): string {
    if (t >= 70) return '#16a34a';
    if (t >= 40) return '#d97706';
    return '#dc2626';
  }
}