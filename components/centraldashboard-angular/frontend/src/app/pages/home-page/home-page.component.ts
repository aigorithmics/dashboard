import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent {
    private sub: Subscription = new Subscription();  
  constructor(
    @Inject(HttpClient) private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.sub.add(this.getPipelines().subscribe())
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  getPipelines(): Observable<any> {
    return this.http.get('pipeline/apis/v1beta1/pipelines', {params: { pageSize: 5}})
  }
}
