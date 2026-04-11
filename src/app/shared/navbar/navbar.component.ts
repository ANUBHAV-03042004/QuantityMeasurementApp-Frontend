import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  template: `
    <nav id="navbar">
      <a class="nav-logo" routerLink="/">
        <span class="logo-dragon">🐲</span>
        <span class="logo-text">QUANT<em>RA</em></span>
      </a>
      <div class="nav-tabs">
        <a routerLink="/"           routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">⚔ REALM</a>
        <a routerLink="/operations" routerLinkActive="active">🔥 SPELLS</a>
        <a routerLink="/dashboard"  routerLinkActive="active">🏰 KEEP</a>
        <a routerLink="/profile"    routerLinkActive="active">👤 KNIGHT</a>
      </div>
      <div class="nav-right">
        <ng-container *ngIf="auth.isAuth(); else guestTpl">
          <div class="nav-user">
            <div class="nav-avatar">{{ initials() }}</div>
            <span class="nav-email">{{ auth.user()?.email }}</span>
          </div>
          <button class="btn" style="border-left:var(--border-w) solid var(--ink)" (click)="auth.logout()">⚔ LEAVE</button>
        </ng-container>
        <ng-template #guestTpl>
          <a class="btn" routerLink="/login" style="border-left:var(--border-w) solid var(--ink)">ENTER REALM</a>
          <a class="btn btn-solid" routerLink="/register" style="border-left:var(--border-w) solid var(--ink)">JOIN ↗</a>
        </ng-template>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  initials() { return (this.auth.user()?.email || '??').substring(0, 2).toUpperCase(); }
}
