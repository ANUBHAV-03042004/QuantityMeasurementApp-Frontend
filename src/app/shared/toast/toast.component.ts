import { Component, inject, OnChanges, signal, effect } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgFor, NgClass],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toastSvc.toasts(); trackBy: trackId"
           class="toast in" [ngClass]="t.type">
        <span class="toast-icon">{{ icons[t.type] }}</span>{{ t.msg }}
      </div>
    </div>
  `
})
export class ToastComponent {
  toastSvc = inject(ToastService);
  icons: Record<string, string> = { success: '✓', error: '✕', info: '!' };
  trackId = (_: number, t: Toast) => t.id;
}
