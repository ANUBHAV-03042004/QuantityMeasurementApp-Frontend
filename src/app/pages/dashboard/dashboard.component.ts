import { Component, OnInit, AfterViewInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { gsap } from 'gsap';

export interface ArcItem { id: string; val: number; dash: number; offset: number; }
export interface BarItem { label: string; val: number; color: string; pct: number; }

const OP_SYMBOLS: Record<string, string> = { COMPARE:'=?', CONVERT:'→', ADD:'+', SUBTRACT:'−', DIVIDE:'÷' };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  // Real values from API
  stats = { total: 0, compare: 0, convert: 0, errors: 0 };
  // Animated display values - updated via setInterval, no DOM mutation
  displayStats = { total: 0, compare: 0, convert: 0, errors: 0 };

  bars: BarItem[] = [];
  arcs: ArcItem[] = [
    { id:'arc-length', val:0, dash:0, offset:0 },
    { id:'arc-weight', val:0, dash:0, offset:0 },
    { id:'arc-volume', val:0, dash:0, offset:0 },
    { id:'arc-temp',   val:0, dash:0, offset:0 },
  ];
  recent: any[] = [];
  loading = true;
  opSymbols = OP_SYMBOLS;
  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private pid: Object) {
    this.isBrowser = isPlatformBrowser(pid);
  }

  get isAuth() { return this.auth.isAuth(); }

  ngOnInit() {
    if (!this.isAuth) { this.loading = false; return; }
    forkJoin({
      cmp: this.api.get<number>('/quantities/count/COMPARE').pipe(catchError(() => of(0))),
      cnv: this.api.get<number>('/quantities/count/CONVERT').pipe(catchError(() => of(0))),
      add: this.api.get<number>('/quantities/count/ADD').pipe(catchError(() => of(0))),
      sub: this.api.get<number>('/quantities/count/SUBTRACT').pipe(catchError(() => of(0))),
      div: this.api.get<number>('/quantities/count/DIVIDE').pipe(catchError(() => of(0))),
      err: this.api.get<any[]>('/quantities/history/errored').pipe(catchError(() => of([]))),
      len: this.api.get<any[]>('/quantities/history/type/LengthUnit').pipe(catchError(() => of([]))),
      wgt: this.api.get<any[]>('/quantities/history/type/WeightUnit').pipe(catchError(() => of([]))),
      vol: this.api.get<any[]>('/quantities/history/type/VolumeUnit').pipe(catchError(() => of([]))),
      tmp: this.api.get<any[]>('/quantities/history/type/TemperatureUnit').pipe(catchError(() => of([]))),
      rec: forkJoin(['COMPARE','ADD','CONVERT','SUBTRACT','DIVIDE'].map(op =>
        this.api.get<any[]>(`/quantities/history/operation/${op}`).pipe(catchError(() => of([])))
      )).pipe(catchError(() => of([[]])))
    }).subscribe({
      next: (d: any) => {
        const total = d.cmp + d.cnv + d.add + d.sub + d.div;
        this.stats = { total, compare: d.cmp, convert: d.cnv, errors: d.err.length };
        const max = Math.max(d.cmp, d.cnv, d.add, d.sub, d.div, 1);
        this.bars = [
          { label:'CMP', val:d.cmp, color:'var(--fire-red)',    pct: Math.max(d.cmp/max*100, 4) },
          { label:'CNV', val:d.cnv, color:'var(--fire-gold)',   pct: Math.max(d.cnv/max*100, 4) },
          { label:'ADD', val:d.add, color:'var(--dragon-teal)', pct: Math.max(d.add/max*100, 4) },
          { label:'SUB', val:d.sub, color:'var(--stone-light)', pct: Math.max(d.sub/max*100, 4) },
          { label:'DIV', val:d.div, color:'var(--forest-mid)',  pct: Math.max(d.div/max*100, 4) },
        ];
        const circ = 276;
        const typeTot = d.len.length + d.wgt.length + d.vol.length + d.tmp.length || 1;
        let offset = 0;
        this.arcs = [
          { id:'arc-length', val: d.len.length },
          { id:'arc-weight', val: d.wgt.length },
          { id:'arc-volume', val: d.vol.length },
          { id:'arc-temp',   val: d.tmp.length },
        ].map(a => {
          const dash = circ * (a.val / typeTot);
          const item: ArcItem = { ...a, dash, offset };
          offset += dash;
          return item;
        });
        this.recent = (d.rec as any[][]).flat().sort((a: any, b: any) => (b.id||0) - (a.id||0)).slice(0, 6);
        this.loading = false;
        if (this.isBrowser) this.animateCounters();
      },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    gsap.from('.dash-header', { y: 20, opacity: 0, duration: .5, ease: 'expo.out', delay: .1 });
  }

  // Counter animation using Angular bindings only — zero DOM mutation, zero reflow
  private animateCounters() {
    const duration = 1200; // ms
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // ease out quad
      const eased = 1 - Math.pow(1 - progress, 2);
      this.displayStats = {
        total:   Math.round(this.stats.total   * eased),
        compare: Math.round(this.stats.compare * eased),
        convert: Math.round(this.stats.convert * eased),
        errors:  Math.round(this.stats.errors  * eased),
      };
      if (step >= steps) {
        this.displayStats = { ...this.stats };
        clearInterval(timer);
      }
    }, interval);
  }

  getRecentResult(r: any): string {
    if (r.operation === 'COMPARE') return r.resultString === 'true' ? '= true' : '≠ false';
    if (r.resultValue != null) return `→ ${parseFloat((r.resultValue||0).toFixed(4))} ${r.resultUnit||''}`;
    return '';
  }
}