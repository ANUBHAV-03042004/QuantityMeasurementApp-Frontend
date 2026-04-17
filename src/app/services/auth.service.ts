import { Injectable, signal, computed, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

export interface UserState { email: string; role: string; }

const INACTIVITY_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY_TOKEN = 'qm_token';
const STORAGE_KEY_USER  = 'qm_user';
const STORAGE_KEY_LAST  = 'qm_last_active';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private _token = signal<string | null>(localStorage.getItem(STORAGE_KEY_TOKEN));
  private _user  = signal<UserState | null>(
    JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || 'null')
  );

  readonly token  = this._token.asReadonly();
  readonly user   = this._user.asReadonly();
  readonly isAuth = computed(() => !!this._token());

  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  private boundActivityHandler = () => this.resetInactivityTimer();

  constructor(private router: Router, private ngZone: NgZone) {
    // On service init, check if the session already expired while tab was closed
    this.checkExpiredOnInit();

    if (this.isAuth()) {
      this.startInactivityTimer();
    }

    // Log out when the tab/window is closed
    window.addEventListener('beforeunload', () => this.onTabClose());
  }

  private checkExpiredOnInit() {
    const lastActive = localStorage.getItem(STORAGE_KEY_LAST);
    if (lastActive && this._token()) {
      const elapsed = Date.now() - parseInt(lastActive, 10);
      if (elapsed >= INACTIVITY_MS) {
        this.clearStorage();
        this._token.set(null);
        this._user.set(null);
      }
    }
  }

  setAuth(token: string, user: UserState) {
    this._token.set(token);
    this._user.set(user);
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_LAST, Date.now().toString());
    this.startInactivityTimer();
  }

  logout() {
    this.stopInactivityTimer();
    this.clearStorage();
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/']);
  }

  private startInactivityTimer() {
    this.stopInactivityTimer();
    // Run outside Angular zone so change detection isn't triggered on every mouse move
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach(e =>
        window.addEventListener(e, this.boundActivityHandler, { passive: true })
      );
      this.resetInactivityTimer();
    });
  }

  private resetInactivityTimer() {
    localStorage.setItem(STORAGE_KEY_LAST, Date.now().toString());
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      // Re-enter Angular zone to trigger navigation + change detection
      this.ngZone.run(() => this.logout());
    }, INACTIVITY_MS);
  }

  private stopInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.activityEvents.forEach(e =>
      window.removeEventListener(e, this.boundActivityHandler)
    );
  }

  private onTabClose() {
    // Clear storage AND null the signals so any same-tab reads after unload
    // see the logged-out state (prevents stale email showing in navbar).
    this.clearStorage();
    this._token.set(null);
    this._user.set(null);
  }

  private clearStorage() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_LAST);
  }

  ngOnDestroy() {
    this.stopInactivityTimer();
  }
}