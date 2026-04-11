import { Component, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="page-loader" [class.done]="done()">
      <div class="loader-dragon">🐲</div>
      <div class="loader-brand">QUANT<em style="color:var(--fire-red)">RA</em></div>
      <div class="loader-track"></div>
      <div class="loader-sub">Awakening the dragon...</div>
    </div>
  `
})
export class LoaderComponent implements OnInit {
  done = signal(false);
  constructor(@Inject(PLATFORM_ID) private pid: Object) {}
  ngOnInit() {
    if (!isPlatformBrowser(this.pid)) return;
    setTimeout(() => this.done.set(true), 1400);
  }
}
