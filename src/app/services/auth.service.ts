import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface UserState { email: string; role: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal<string | null>(localStorage.getItem('qm_token'));
  private _user  = signal<UserState | null>(JSON.parse(localStorage.getItem('qm_user') || 'null'));

  readonly token  = this._token.asReadonly();
  readonly user   = this._user.asReadonly();
  readonly isAuth = computed(() => !!this._token());

  constructor(private router: Router) {}

  setAuth(token: string, user: UserState) {
    this._token.set(token);
    this._user.set(user);
    localStorage.setItem('qm_token', token);
    localStorage.setItem('qm_user', JSON.stringify(user));
  }

  logout() {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem('qm_token');
    localStorage.removeItem('qm_user');
    this.router.navigate(['/']);
  }
}
