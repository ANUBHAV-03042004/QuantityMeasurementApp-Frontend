import { Component, inject, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf],
  templateUrl: './login.component.html'
})
export class LoginComponent implements AfterViewInit {
  email = ''; password = ''; loading = false;
  emailErr = ''; passErr = '';
  private BASE = 'https://dpvh78pj77mvc.cloudfront.net/api/v1';
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private http   = inject(HttpClient);
  private router = inject(Router);
  constructor(@Inject(PLATFORM_ID) private pid: Object) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.pid)) return;
    if (this.auth.isAuth()) { this.router.navigate(['/operations']); return; }
    gsap.timeline({ delay: .1 })
      .from('.auth-left',  { x: -30, opacity: 0, duration: .5, ease: 'power2.out' })
      .from('.auth-right', { x: 30,  opacity: 0, duration: .5, ease: 'power2.out' }, '-.3');
  }

  loginWithGoogle() {
    // Tell the backend which frontend is initiating the OAuth flow FIRST
    // so it can redirect the token back to the correct GitHub Pages URL
    this.http.post(`${this.BASE}/auth/oauth2-origin`,
      { origin: window.location.origin },
      { withCredentials: true }
    ).subscribe({
      next: () => {
        window.location.href = 'https://dpvh78pj77mvc.cloudfront.net/api/v1/auth/oauth2-start?frontend=angular';
      },
      error: () => {
        // Even if registration fails, still try the OAuth flow — it'll use the fallback
        window.location.href = 'https://dpvh78pj77mvc.cloudfront.net/api/v1/auth/oauth2-start?frontend=angular';
      }
    });
  }

  doLogin() {
    this.emailErr = ''; this.passErr = '';
    if (!this.email) { this.emailErr = 'Email is required'; return; }
    if (!this.password) { this.passErr = 'Password is required'; return; }
    this.loading = true;
    this.http.post<any>(`${this.BASE}/auth/login`, { email: this.email, password: this.password })
      .subscribe({
        next: (json) => {
          this.auth.setAuth(json.token, { email: json.email, role: json.role });
          this.toast.show('Welcome back, Knight! ⚔', 'success');
          setTimeout(() => this.router.navigate(['/operations']), 700);
        },
        error: (e) => {
          const msg = e.error?.message || e.error?.error || 'Invalid credentials';
          this.passErr = msg; this.toast.show(msg, 'error'); this.loading = false;
        }
      });
  }
}
