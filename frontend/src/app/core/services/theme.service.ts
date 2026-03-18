import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'wh_theme';

  private _theme$ = new BehaviorSubject<Theme>(this.getInitialTheme());
  readonly theme$ = this._theme$.asObservable();

  get current(): Theme {
    return this._theme$.value;
  }

  constructor() {
    // Apply on init
    this.applyTheme(this._theme$.value);
    // Keep in sync if system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        const t: Theme = e.matches ? 'dark' : 'light';
        this._theme$.next(t);
        this.applyTheme(t);
      }
    });
  }

  toggle(): void {
    const next: Theme = this._theme$.value === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: Theme): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
    this._theme$.next(theme);
    this.applyTheme(theme);
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
