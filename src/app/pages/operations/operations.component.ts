import { Component, OnInit, AfterViewInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass, TitleCasePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { gsap } from 'gsap';

const UNITS: Record<string,string[]> = {
  LengthUnit:      ['FEET','INCHES','YARDS','CENTIMETERS'],
  WeightUnit:      ['MILLIGRAM','GRAM','KILOGRAM','POUND','TONNE'],
  VolumeUnit:      ['LITRE','MILLILITRE','GALLON'],
  TemperatureUnit: ['CELSIUS','FAHRENHEIT','KELVIN'],
};
const OP_META: Record<string,any> = {
  COMPARE:  { title:'Compare',  desc:'Check if two quantities are equal',     symbol:'=?', endpoint:'/compare' },
  CONVERT:  { title:'Convert',  desc:'Convert a quantity to a different unit', symbol:'→',  endpoint:'/convert' },
  ADD:      { title:'Add',      desc:'Sum two quantities',                     symbol:'+',  endpoint:'/add' },
  SUBTRACT: { title:'Subtract', desc:'Subtract one quantity from another',     symbol:'−',  endpoint:'/subtract' },
  DIVIDE:   { title:'Divide',   desc:'Ratio between two quantities',           symbol:'÷',  endpoint:'/divide' },
};

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf, NgFor, NgClass, TitleCasePipe, NgClass],
  templateUrl: './operations.component.html'
})
export class OperationsComponent implements OnInit, AfterViewInit {
  ops = ['COMPARE','CONVERT','ADD','SUBTRACT','DIVIDE'];
  filters = ['ALL','COMPARE','CONVERT','ADD','SUBTRACT','DIVIDE','ERRORED'];
  currentOp = 'COMPARE';
  histFilter = 'ALL';
  mtype = 'LengthUnit';
  val1 = ''; val2 = '';
  unit1 = 'FEET'; unit2 = 'FEET';
  mtypes = Object.keys(UNITS);
  get units() { return UNITS[this.mtype] || []; }
  get meta()  { return OP_META[this.currentOp]; }

  running = false;
  result: any = null;
  history: any[] = [];
  histLoading = false;

  private api   = inject(ApiService);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  constructor(@Inject(PLATFORM_ID) private pid: Object) {}

  get isAuth()     { return this.auth.isAuth(); }
  get isConvert()  { return this.currentOp === 'CONVERT'; }

  /** Strips "Unit" suffix so "LengthUnit" → "LENGTH", "WeightUnit" → "WEIGHT" */
  cleanType(t: string): string {
    return (t || '').replace(/Unit$/i, '').toUpperCase();
  }

  ngOnInit() { this.updateUnits(); if (this.isAuth) this.loadHistory(); }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.pid)) return;
    gsap.from('.ops-sidebar', { x: -30, opacity: 0, duration: .5, ease: 'expo.out', delay: .1 });
    gsap.from('.ops-header',  { y: 20,  opacity: 0, duration: .5, ease: 'expo.out', delay: .2 });
  }

  selectOp(op: string) {
    this.currentOp = op; this.result = null;
    if (op === 'CONVERT') {
      this.val2 = '0'; // value irrelevant for convert, only unit2 matters
    }
    gsap.fromTo('.ops-title', { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: .3, ease: 'power2.out' });
  }

  get isConvert() { return this.currentOp === 'CONVERT'; }

  selectFilter(f: string) {
    this.histFilter = f;
    if (this.isAuth) this.loadHistory();
  }

  updateUnits() {
    const u = UNITS[this.mtype];
    this.unit1 = u[0]; this.unit2 = u[0];
  }

  runOperation() {
    const v1 = parseFloat(this.val1);
    const v2 = this.currentOp === 'CONVERT' ? 0 : parseFloat(this.val2);
    if (isNaN(v1)) { this.toast.show('Enter a valid number','error'); return; }
    if (this.currentOp !== 'CONVERT' && isNaN(v2)) { this.toast.show('Enter valid numbers','error'); return; }
    this.running = true;
    const body = {
      thisQuantityDTO: { value:v1, unit:this.unit1, measurementType:this.mtype },
      thatQuantityDTO: { value:v2, unit:this.unit2, measurementType:this.mtype }
    };
    this.api.post<any>('/quantities'+this.meta.endpoint, body).subscribe({
      next: (data) => {
        this.result = data; this.running = false;
        this.toast.show('Operation complete','success');
        if (isPlatformBrowser(this.pid))
          gsap.fromTo('.result-card', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'expo.out' });
        if (this.isAuth) this.loadHistory();
      },
      error: (e) => {
        const msg = e.error?.message || e.error?.error || 'Operation failed';
        this.toast.show(msg,'error'); this.running=false;
        this.result = { error: true, errorMessage: msg };
      }
    });
  }

  loadHistory() {
    this.histLoading = true;
    const f = this.histFilter;
    const obs = f==='ALL'
      ? forkJoin(['COMPARE','CONVERT','ADD','SUBTRACT','DIVIDE'].map(op =>
          this.api.get<any[]>(`/quantities/history/operation/${op}`).pipe(catchError(()=>of([])))))
          .pipe(catchError(()=>of([])))
      : f==='ERRORED'
        ? this.api.get<any[]>('/quantities/history/errored').pipe(catchError(()=>of([])))
        : this.api.get<any[]>(`/quantities/history/operation/${f}`).pipe(catchError(()=>of([])));

    obs.subscribe({
      next: (data: any) => {
        this.history = Array.isArray(data[0]) ? (data as any[][]).flat().sort((a:any,b:any)=>(b.id||0)-(a.id||0)) : (data as any[]).sort((a:any,b:any)=>(b.id||0)-(a.id||0));
        this.histLoading = false;
        if (isPlatformBrowser(this.pid))
          setTimeout(()=>gsap.from('.history-table tbody tr', { opacity:0, y:6, stagger:.025, duration:.3, ease:'power2.out' }), 50);
      },
      error: () => { this.histLoading=false; }
    });
  }

  resultDisplay() {
    if (!this.result || this.result.error) return null;
    if (this.currentOp==='COMPARE') {
      const eq = this.result.resultString==='true';
      return { val: eq?'Equal':'Not equal', color: eq?'var(--accent2)':'var(--accent3)', unit: `${this.result.thisValue} ${this.result.thisUnit} ${eq?'=':'≠'} ${this.result.thatValue} ${this.result.thatUnit}` };
    }
    const v = Number.isInteger(this.result.resultValue) ? this.result.resultValue : parseFloat((this.result.resultValue||0).toFixed(6));
    return { val: v, color: 'var(--accent)', unit: this.result.resultUnit||'' };
  }

  cleanType(raw: string): string {
    return raw ? raw.replace('Unit', '') : '';
  }

  formatResult(r: any): string {
    if (r.resultString) return r.resultString;
    if (r.resultValue !== null && r.resultValue !== undefined) return `${parseFloat((r.resultValue||0).toFixed(4))} ${r.resultUnit||''}`;
    return '—';
  }
}