import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WikiPage } from '../models/types';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class WikipediaService {
  private readonly base = `${environment.backendUrl}/api/wikipedia`;

  constructor(private http: HttpClient, private lang: LanguageService) {}

  private get l(): string {
    return this.lang.current;
  }

  getRandomPage(): Observable<WikiPage> {
    return this.http.get<WikiPage>(`${this.base}/random?lang=${this.l}`);
  }

  getPageSummary(title: string): Observable<WikiPage> {
    return this.http.get<WikiPage>(`${this.base}/summary/${encodeURIComponent(title)}?lang=${this.l}`);
  }

  searchPages(query: string): Observable<WikiPage[]> {
    return this.http.get<WikiPage[]>(`${this.base}/search?q=${encodeURIComponent(query)}&lang=${this.l}`);
  }

  getPageContent(title: string): Observable<{ html: string; title: string }> {
    return this.http.get<{ html: string; title: string }>(
      `${this.base}/content/${encodeURIComponent(title)}?lang=${this.l}`
    );
  }
}
