import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; msg: string; type: 'success'|'error'|'info'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private id = 0;

  show(msg: string, type: Toast['type'] = 'info') {
    const t: Toast = { id: ++this.id, msg, type };
    this.toasts.update(ts => [...ts, t]);
    setTimeout(() => this.toasts.update(ts => ts.filter(x => x.id !== t.id)), 3200);
  }
}
