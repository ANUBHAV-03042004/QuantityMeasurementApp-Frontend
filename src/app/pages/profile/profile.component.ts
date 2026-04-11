import { Component, OnInit, AfterViewInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { gsap } from 'gsap';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit, AfterViewInit {
  auth   = inject(AuthService);
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  user: any = null; stats = { total:0, success:0, errors:0 }; loading=true;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private pid: Object) {
    this.isBrowser = isPlatformBrowser(pid);
  }

  get initials() {
    if (!this.user) return '?';
    return ((this.user.firstName||'?')[0]+(this.user.lastName||'?')[0]).toUpperCase();
  }

  ngOnInit() {
    this.api.get<any>('/users/me').subscribe({
      next: (u) => {
        this.user = u; this.loading = false;
        forkJoin({
          counts: forkJoin(['COMPARE','CONVERT','ADD','SUBTRACT','DIVIDE'].map(op =>
            this.api.get<number>(`/quantities/count/${op}`).pipe(catchError(()=>of(0)))
          )),
          errs: this.api.get<any[]>('/quantities/history/errored').pipe(catchError(()=>of([])))
        }).subscribe(d => {
          const total = (d.counts as number[]).reduce((a,b)=>a+b,0);
          this.stats = { total, success: total - d.errs.length, errors: d.errs.length };
          if (this.isBrowser) setTimeout(()=>this.animStats(), 50);
        });
      },
      error: () => { this.loading=false; }
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    gsap.from('.profile-hero', { y:30, opacity:0, duration:.6, ease:'expo.out', delay:.1 });
  }

  private animStats() {
    const anim = (id:string, target:number) => {
      const el=document.getElementById(id);
      if(!el) return;
      gsap.to({val:0},{val:target,duration:1.2,ease:'power2.out',
        onUpdate:function(){el.textContent=String(Math.round((this as any)['targets']()[0].val))}});
    };
    anim('ps-total',   this.stats.total);
    anim('ps-success', this.stats.success);
    anim('ps-errors',  this.stats.errors);
  }

  logout() { this.auth.logout(); }
}
