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
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements AfterViewInit {
  firstName=''; lastName=''; email=''; password='';
  loading=false; firstErr=''; lastErr=''; emailErr=''; passErr='';
  private BASE = 'https://quantity-measurement-app-backend.azurewebsites.net/api/v1';
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
    this.http.post(`${this.BASE}/auth/oauth2-origin`,
      { origin: window.location.origin },
      { withCredentials: true }
    ).subscribe({
      next: () => {
        window.location.href = 'https://quantity-measurement-app-backend.azurewebsites.net/oauth2/authorization/google';
      },
      error: () => {
        window.location.href = 'https://quantity-measurement-app-backend.azurewebsites.net/oauth2/authorization/google';
      }
    });
  }

  doRegister() {
    this.firstErr=this.lastErr=this.emailErr=this.passErr='';
    if (!this.firstName) { this.firstErr='Required'; return; }
    if (!this.lastName)  { this.lastErr='Required'; return; }
    if (!this.email)     { this.emailErr='Email is required'; return; }
    if (!this.password)  { this.passErr='Password is required'; return; }
    this.loading=true;
    this.http.post<any>(`${this.BASE}/auth/register`,
      { firstName:this.firstName, lastName:this.lastName, email:this.email, password:this.password })
      .subscribe({
        next: (json) => {
          this.auth.setAuth(json.token, { email:json.email, role:json.role });
          this.toast.show('Legend forged! Welcome, Knight! 🐲', 'success');
          setTimeout(() => this.router.navigate(['/operations']), 700);
        },
        error: (e) => {
          const msg = e.error?.message || (e.error?.errors && Object.values(e.error.errors).join('. ')) || 'Registration failed';
          this.passErr=msg; this.toast.show(msg,'error'); this.loading=false;
        }
      });
  }
}
