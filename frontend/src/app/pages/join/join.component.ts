import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ selector: 'app-join', standalone: true, imports: [], template: '' })
export class JoinComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') || '';
    this.router.navigate(['/'], { queryParams: { join: code } });
  }
}
