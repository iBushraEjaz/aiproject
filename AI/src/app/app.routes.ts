import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
//import { LayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
  },

  // ✅ Layout wraps all protected pages
  {
    path: '',
   // component: LayoutComponent,       // ← ADD THIS BACK
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'analyzer',  loadComponent: () => import('./analyzer/analyzer.component').then(m => m.AnalyzerComponent)   },
      { path: 'reports',   loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)       },
      { path: 'history',   loadComponent: () => import('./history/history.component').then(m => m.HistoryComponent)       },
      { path: 'features',  loadComponent: () => import('./features/features.component').then(m => m.FeaturesComponent)    },
      { path: 'team',      loadComponent: () => import('./team/team.component').then(m => m.TeamComponent)                },
      { path: 'settings',  loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)    },
      { path: 'about',     loadComponent: () => import('./about/about.component').then(m => m.AboutComponent)             },
      { path: 'pricing',   loadComponent: () => import('./pricing/pricing.component').then(m => m.PricingComponent)       },
    ],
  },

  { path: '**', redirectTo: 'login' },
];