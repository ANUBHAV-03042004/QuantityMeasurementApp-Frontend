import { Component, inject, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent implements AfterViewInit {
  email = '';
  emailErr = '';
  loading = false;
  sent = false;

  private BASE  = 'https://dpvh78pj77mvc.cloudfront.net/api/v1';
  private toast = inject(ToastService);
  private http  = inject(HttpClient);
  constructor(@Inject(PLATFORM_ID) private pid: Object) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.pid)) return;
    gsap.timeline({ delay: .1 })
      .from('.auth-left',  { x: -30, opacity: 0, duration: .5, ease: 'power2.out' })
      .from('.auth-right', { x: 30,  opacity: 0, duration: .5, ease: 'power2.out' }, '-.3');
  }

  doSubmit() {
    this.emailErr = '';
    if (!this.email) { this.emailErr = 'Email is required'; return; }
    this.loading = true;
    this.http.post<any>(`${this.BASE}/auth/forgot-password`, { email: this.email })
      .subscribe({
        next: () => {
          this.sent = true;
          this.loading = false;
          this.toast.show('Scroll dispatched! Check your email 📜', 'success');
        },
        error: (e) => {
          const msg = e.error?.message || 'Something went wrong';
          this.emailErr = msg;
          this.toast.show(msg, 'error');
          this.loading = false;
        }
      });
  }
}
