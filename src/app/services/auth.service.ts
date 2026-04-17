import { Injectable, signal, computed, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

export interface UserState { email: string; role: string; }

const INACTIVITY_MS    = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY_TOKEN  = 'qm_token';
const STORAGE_KEY_USER   = 'qm_user';
const STORAGE_KEY_LAST   = 'qm_last_active';
const STORAGE_KEY_EXPIRY = 'qm_session_expiry'; // absolute expiry timestamp

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
    this.checkExpiredOnInit();

    if (this.isAuth()) {
      this.startInactivityTimer();
    }

    // On tab close: save the CURRENT time as last-active so checkExpiredOnInit
    // can correctly determine elapsed time when the tab is reopened.
    // (Previously this cleared storage entirely, losing the timestamp and
    //  making the expiry check always skip -> user stayed logged in forever.)
    window.addEventListener('beforeunload', () => this.onTabClose());
  }

  private checkExpiredOnInit() {
    if (!this._token()) return; // not logged in, nothing to check

    const lastActive = localStorage.getItem(STORAGE_KEY_LAST);
    const absExpiry  = localStorage.getItem(STORAGE_KEY_EXPIRY);

    // Check absolute expiry first (set at login, survives tab close)
    if (absExpiry && Date.now() >= parseInt(absExpiry, 10)) {
      this.forceLogout();
      return;
    }

    // Fall back to inactivity check via last-active timestamp
    if (lastActive) {
      const elapsed = Date.now() - parseInt(lastActive, 10);
      if (elapsed >= INACTIVITY_MS) {
        this.forceLogout();
        return;
      }
    } else {
      // No last-active at all but token exists and no absolute expiry set —
      // this means it's a legacy session without timestamps. Treat as expired
      // to be safe, so the user logs in fresh and gets proper timestamps.
      this.forceLogout();
    }
  }

  setAuth(token: string, user: UserState) {
    const now = Date.now();
    this._token.set(token);
    this._user.set(user);
    localStorage.setItem(STORAGE_KEY_TOKEN,  token);
    localStorage.setItem(STORAGE_KEY_USER,   JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_LAST,   now.toString());
    // Absolute expiry: login time + 1 hr. Extended on each activity reset.
    localStorage.setItem(STORAGE_KEY_EXPIRY, (now + INACTIVITY_MS).toString());
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
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach(e =>
        window.addEventListener(e, this.boundActivityHandler, { passive: true })
      );
      this.resetInactivityTimer();
    });
  }

  private resetInactivityTimer() {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST,   now.toString());
    // Push the absolute expiry forward too — each moment of activity extends the session
    localStorage.setItem(STORAGE_KEY_EXPIRY, (now + INACTIVITY_MS).toString());

    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
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

  /** Called on tab/window close — saves last-active timestamp so reopening
   *  the tab correctly detects inactivity. Does NOT wipe the token/user,
   *  so a quick reopen within 1hr stays logged in. */
  private onTabClose() {
    localStorage.setItem(STORAGE_KEY_LAST, Date.now().toString());
    // Note: we intentionally do NOT clear the token here anymore.
    // checkExpiredOnInit() handles expiry correctly on next open.
  }

  /** Silent logout used during init — no navigation side-effects from ctor. */
  private forceLogout() {
    this.stopInactivityTimer();
    this.clearStorage();
    this._token.set(null);
    this._user.set(null);
    // Don't navigate here — called from constructor, router may not be ready.
    // The auth guard will redirect to login when they try to access a protected route.
  }

  private clearStorage() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_LAST);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
  }

  ngOnDestroy() {
    this.stopInactivityTimer();
  }
}
