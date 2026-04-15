import { Component, inject, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  newPassword = '';
  confirmPassword = '';
  passErr = '';
  confirmErr = '';
  loading = false;
  validating = true;
  tokenValid = false;
  done = false;

  private token = '';
  private BASE   = 'https://dpvh78pj77mvc.cloudfront.net/api/v1';
  private toast  = inject(ToastService);
  private http   = inject(HttpClient);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  constructor(@Inject(PLATFORM_ID) private pid: Object) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.validating = false;
      this.tokenValid = false;
      return;
    }
    this.http.get<any>(`${this.BASE}/auth/reset-password/validate?token=${this.token}`)
      .subscribe({
        next: (res) => {
          this.tokenValid = res.valid === true;
          this.validating = false;
        },
        error: () => {
          this.tokenValid = false;
          this.validating = false;
        }
      });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.pid)) return;
    gsap.timeline({ delay: .1 })
      .from('.auth-left',  { x: -30, opacity: 0, duration: .5, ease: 'power2.out' })
      .from('.auth-right', { x: 30,  opacity: 0, duration: .5, ease: 'power2.out' }, '-.3');
  }

  doReset() {
    this.passErr = ''; this.confirmErr = '';
    if (!this.newPassword)    { this.passErr    = 'Password is required'; return; }
    if (!this.confirmPassword){ this.confirmErr = 'Please confirm your password'; return; }
    if (this.newPassword !== this.confirmPassword) { this.confirmErr = 'Passwords do not match'; return; }
    this.loading = true;
    this.http.post<any>(`${this.BASE}/auth/reset-password`, {
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.done = true;
        this.loading = false;
        this.toast.show('Passphrase reforged! You may now enter. ⚔', 'success');
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (e) => {
        const msg = e.error?.error || e.error?.message || 'Reset failed';
        this.passErr = msg;
        this.toast.show(msg, 'error');
        this.loading = false;
      }
    });
  }
}
