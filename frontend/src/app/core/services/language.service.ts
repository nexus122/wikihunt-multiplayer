import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { translations, TranslationKey } from '../i18n/translations';

export type Lang = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private langSubject = new BehaviorSubject<Lang>(
    (localStorage.getItem('wh_lang') as Lang) || 'es'
  );

  lang$ = this.langSubject.asObservable();

  get current(): Lang {
    return this.langSubject.value;
  }

  setLang(lang: Lang): void {
    localStorage.setItem('wh_lang', lang);
    this.langSubject.next(lang);
  }

  toggle(): void {
    this.setLang(this.current === 'es' ? 'en' : 'es');
  }

  t(key: TranslationKey): string {
    return translations[this.current][key];
  }
}
