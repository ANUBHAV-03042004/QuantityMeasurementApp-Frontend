import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { CursorComponent } from './shared/cursor/cursor.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { ToastComponent } from './shared/toast/toast.component';
import { inject } from '@vercel/analytics';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CursorComponent, LoaderComponent, ToastComponent],
  template: `
    <app-cursor/>
    <app-loader/>

    <!-- World background sky -->
    <div class="world-bg"></div>

    <!-- Layered mountain silhouettes -->
    <div class="mountains">
      <svg viewBox="0 0 1440 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Far mountains (lightest) -->
        <polygon points="0,220 80,100 160,220"  fill="#2a5a3a" opacity=".4"/>
        <polygon points="60,220 200,50  340,220" fill="#1a4a2a" opacity=".45"/>
        <polygon points="200,220 380,30 560,220" fill="#2a5a3a" opacity=".5"/>
        <polygon points="380,220 560,70 740,220" fill="#1a4a2a" opacity=".45"/>
        <polygon points="560,220 750,20 940,220" fill="#2a5a3a" opacity=".5"/>
        <polygon points="740,220 940,55 1140,220" fill="#1a4a2a" opacity=".45"/>
        <polygon points="940,220 1140,35 1340,220" fill="#2a5a3a" opacity=".5"/>
        <polygon points="1140,220 1300,80 1440,220" fill="#1a4a2a" opacity=".4"/>
        <!-- Near mountains (darkest) -->
        <polygon points="0,220 130,130 260,220" fill="#0f2a18" opacity=".7"/>
        <polygon points="150,220 320,80  490,220" fill="#122a1a" opacity=".75"/>
        <polygon points="380,220 580,60  780,220" fill="#0f2a18" opacity=".8"/>
        <polygon points="600,220 820,90  1040,220" fill="#122a1a" opacity=".75"/>
        <polygon points="840,220 1060,55 1280,220" fill="#0f2a18" opacity=".8"/>
        <polygon points="1080,220 1260,110 1440,220" fill="#122a1a" opacity=".7"/>
        <!-- Dragon silhouettes on peaks -->
        <text x="310" y="80"  font-size="24" opacity=".3" fill="#1a3a20">🐲</text>
        <text x="800" y="62"  font-size="20" opacity=".25" fill="#1a3a20">🐉</text>
        <text x="1220" y="55" font-size="18" opacity=".2" fill="#1a3a20">🦅</text>
      </svg>
    </div>

    <!-- Ground strip with grass -->
    <div class="ground-strip"></div>

    <!-- Ground creatures (fixed at bottom) -->
    <div class="ground-creatures">
      <span class="gc gc--left">🌿</span>
      <span class="gc gc--left2">🌾</span>
      <span class="gc gc--right">🌿</span>
      <span class="gc gc--right2">🌾</span>
    </div>

    <app-navbar/>
    <router-outlet/>
    <app-toast/>
  `,
  styles: [`
    .ground-creatures { position:fixed; bottom:4px; left:0; right:0; z-index:6; pointer-events:none; }
    .gc { position:absolute; font-size:32px; }
    .gc--left  { left:120px; }
    .gc--left2 { left:240px; font-size:24px; }
    .gc--right  { right:120px; }
    .gc--right2 { right:240px; font-size:24px; }
  `]
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    inject();
  }
}