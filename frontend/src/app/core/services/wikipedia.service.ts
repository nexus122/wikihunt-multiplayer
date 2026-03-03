import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WikiPage } from '../models/types';

@Injectable({ providedIn: 'root' })
export class WikipediaService {
  private readonly base = `${environment.backendUrl}/api/wikipedia`;

  constructor(private http: HttpClient) {}

  getRandomPage(): Observable<WikiPage> {
    return this.http.get<WikiPage>(`${this.base}/random`);
  }

  getPageSummary(title: string): Observable<WikiPage> {
    return this.http.get<WikiPage>(`${this.base}/summary/${encodeURIComponent(title)}`);
  }

  searchPages(query: string): Observable<WikiPage[]> {
    return this.http.get<WikiPage[]>(`${this.base}/search?q=${encodeURIComponent(query)}`);
  }

  getPageContent(title: string): Observable<{ html: string; title: string }> {
    return this.http.get<{ html: string; title: string }>(
      `${this.base}/content/${encodeURIComponent(title)}`
    );
  }
}
