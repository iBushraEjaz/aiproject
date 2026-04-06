import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'SEOGEN AI';

  // Auth routes where navbar should NEVER appear
  private readonly authRoutes = ['/login', '/register'];

  constructor(public auth: AuthService, private router: Router) {}

  /** True only when logged in AND NOT on an auth page */
  get showNav(): boolean {
    const url = this.router.url.split('?')[0]; // strip query params
    const onAuthPage = this.authRoutes.some(r => url === r || url.startsWith(r + '/'));
    return this.auth.isLoggedIn() && !onAuthPage;
  }

  getCurrentUser() {
    return this.auth.getCurrentUser();
  }

  logout(): void {
    this.auth.logout();
  }
}