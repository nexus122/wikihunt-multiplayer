import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslationKey } from '../../core/i18n/translations';
import { CosmeticsComponent } from '../../core/components/cosmetics.component';

@Component({
  selector: 'app-setup-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CosmeticsComponent],
  templateUrl: './setup-profile.component.html',
  styleUrl: './setup-profile.component.scss',
})
export class SetupProfileComponent implements OnInit, OnDestroy {
  displayName = '';
  suggestion = '';
  checking = false;
  saving = false;
  nameAvailable: boolean | null = null;
  error = '';
  private langSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    public lang: LanguageService,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('wh_name');
    if (saved) this.displayName = saved;
    this.langSub = this.lang.lang$.subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  async checkName(): Promise<void> {
    const name = this.displayName.trim();
    if (!name) { this.error = this.t('setup_name_placeholder'); return; }
    this.checking = true;
    this.error = '';
    this.suggestion = '';
    this.nameAvailable = null;

    const available = await this.authService.isNameAvailable(name);
    this.nameAvailable = available;

    if (!available) {
      // Find next available suggestion: name#2, name#3, ...
      let n = 2;
      while (n <= 99) {
        const candidate = `${name}#${n}`;
        const ok = await this.authService.isNameAvailable(candidate);
        if (ok) { this.suggestion = candidate; break; }
        n++;
      }
    }

    this.checking = false;
  }

  useSuggestion(): void {
    this.displayName = this.suggestion;
    this.suggestion = '';
    this.nameAvailable = true;
  }

  async save(): Promise<void> {
    const name = this.displayName.trim();
    if (!name) { this.error = this.t('setup_name_placeholder'); return; }

    // Verify availability if not already checked
    if (this.nameAvailable === null || this.nameAvailable === false) {
      await this.checkName();
      if (!this.nameAvailable) return;
    }

    this.saving = true;
    this.error = '';
    const { error } = await this.authService.createProfile(name);
    this.saving = false;

    if (error) {
      this.error = error;
      return;
    }

    localStorage.setItem('wh_name', name);
    this.router.navigate(['/']);
  }
}
