import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="page-wrap">
      <div class="cb-wrap">
        <div class="cb-spinner"></div>
        <div class="cb-title">{{title}}</div>
        <div class="cb-sub">{{sub}}</div>
      </div>
    </div>
  `
})
export class OauthCallbackComponent implements OnInit {
  title = 'Signing you in…'; sub = 'Please wait';
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AuthService);

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.title = 'Sign-in failed'; this.sub = 'No token — redirecting…';
      setTimeout(() => this.router.navigate(['/login']), 2000); return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      const email = payload.sub || payload.email || '';
      const role  = payload.role || 'USER';
      this.auth.setAuth(token, { email, role });
      this.sub = `Welcome, ${email}`;
    } catch { this.auth.setAuth(token, { email: '', role: 'USER' }); }
    setTimeout(() => this.router.navigate(['/operations']), 800);
  }
}
