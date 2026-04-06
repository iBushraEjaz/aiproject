import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USER_KEY  = 'seogen_user';
  private readonly TOKEN_KEY = 'seogen_token';

  // Reactive signal — Angular will detect changes
  private _loggedIn = signal<boolean>(!!localStorage.getItem(this.TOKEN_KEY));
  readonly loggedIn = computed(() => this._loggedIn());

  constructor(private router: Router) {}

  login(email: string, password: string): boolean {
    if (email && password) {
      const user: User = { name: 'User', email };
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.TOKEN_KEY, 'mock_token_12345');
      this._loggedIn.set(true);
      return true;
    }
    return false;
  }

  register(name: string, email: string, password: string): boolean {
    if (name && email && password) {
      const user: User = { name, email };
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.TOKEN_KEY, 'mock_token_12345');
      this._loggedIn.set(true);
      return true;
    }
    return false;
  }

  isLoggedIn(): boolean {
    return this._loggedIn();
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this._loggedIn.set(false);
    this.router.navigate(['/login']);
  }
}