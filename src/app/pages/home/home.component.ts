import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private pid: Object) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.pid)) return;
    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance - step animation like pixel art
    gsap.timeline({ delay: .3 })
      .from('.hero-card', { y: 30, opacity: 0, duration: .5, ease: 'steps(6)' })
      .from('.hero-eyebrow', { x: -10, opacity: 0, duration: .3, ease: 'steps(4)' }, '-.1')
      .from('.hero-title',   { x: -10, opacity: 0, duration: .3, ease: 'steps(4)' }, '-.1')
      .from('.hero-sub',     { y: 8,   opacity: 0, duration: .3, ease: 'steps(4)' }, '-.1')
      .from('.btn-row .px-btn', { y: 8, opacity: 0, stagger: .08, duration: .2, ease: 'steps(3)' }, '-.1');

    // Scroll reveals using steps for pixel feel
    ScrollTrigger.batch('.reveal', {
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: .3, stagger: .06, ease: 'steps(4)' }),
      start: 'top 92%',
    });
    ScrollTrigger.batch('.reveal-left', {
      onEnter: batch => gsap.to(batch, { opacity: 1, x: 0, duration: .3, stagger: .05, ease: 'steps(4)' }),
      start: 'top 92%',
    });
    ScrollTrigger.batch('.reveal-scale', {
      onEnter: batch => gsap.to(batch, { opacity: 1, scale: 1, duration: .3, stagger: .05, ease: 'steps(3)' }),
      start: 'top 92%',
    });

    // Hover tilt on feat-cards (subtle, pixel-style step)
    document.querySelectorAll<HTMLElement>('.feat-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        gsap.to(card, { rotateY: x*6, rotateX: -y*6, duration: .2, ease: 'steps(3)', transformPerspective: 600 });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateY:0, rotateX:0, duration: .2, ease: 'steps(3)' });
      });
    });
  }
}
