import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardLinks } from '../types/dashboard-links';
import { EnvInfo } from '../types/env-info';

@Injectable({
  providedIn: 'root',
})
export class CDBBackendService {
  public logoutUrl = signal<string>('/logout');

  constructor(@Inject(HttpClient) private http: HttpClient) {}

  public getEnvInfo(): Observable<EnvInfo> {
    const url = `api/workgroup/env-info`;

    return this.http.get<EnvInfo>(url);
  }

  public getDashboardLinks(): Observable<DashboardLinks> {
    const url = 'api/dashboard-links';

    return this.http.get<DashboardLinks>(url);
  }

  public setLogoutUrl(link: string): void {
    this.logoutUrl.set(link);
  } 
}
