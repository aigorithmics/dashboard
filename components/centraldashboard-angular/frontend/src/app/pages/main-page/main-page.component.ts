import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DashboardLinks, Link, MenuLink } from 'src/app/types/dashboard-links';
import { Params, Router } from '@angular/router';
import {
  appendBackslash,
  getUrlFragment,
  removePrefixFrom,
} from 'src/app/shared/utils';
import { EnvironmentService } from 'src/app/services/environment.service';
import { PlatformInfo } from 'src/app/types/platform-info';
import { CDBNamespaceService } from 'src/app/services/namespace.service';
import { Namespace } from 'src/app/types/namespace';
import { CDBBackendService } from 'src/app/services/backend.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    standalone: false
})
export class MainPageComponent implements OnInit, OnDestroy {
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay(),
    );


  public buildLabel: string = 'Build';
  public buildVersion: string = environment.buildVersion;
  public buildId: string = environment.buildVersion;
  public get buildVersionWithLabel() {
    return this.computeBuildValue(this.buildLabel, this.buildVersion);
  }
  public get buildIdWithLabel() {
    return this.computeBuildValue(this.buildLabel, this.buildId);
  }
  public menuLinks: MenuLink[];
  public externalLinks: any[];
  public quickLinks: Link[];
  public documentationItems: Link[];
  public currentNamespace: string;
  public isIframed = false;
  private sub = new Subscription();

  constructor(
    @Inject(BreakpointObserver) private breakpointObserver: BreakpointObserver,
    @Inject(Router) private router: Router,
    @Inject(EnvironmentService) private env: EnvironmentService,
    @Inject(CDBNamespaceService) private ns: CDBNamespaceService,
    @Inject(CDBBackendService) private backendService: CDBBackendService,
  ) {}

  ngOnInit() {
    this.sub.add(this.env.platform.subscribe((platform: PlatformInfo) => {
      this.storeBuildInfo(platform);
    }));

    this.sub.add(this.env.dashboardLinks.subscribe((links: DashboardLinks) => {
      this.storeDashboardLinks(links);
    }));

    this.sub.add(this.ns.currentNamespace.subscribe((namespace: Namespace) => {
      this.currentNamespace = namespace.namespace;
    }));

    /**
     * Handles case when an iframed page requests an invalid route
     * by hiding the sidebar and the header resulting in the iframed
     * CDB showing only the iframe, preventing thus an inception effect
     */
    if (window.location !== window.parent.location) {
      this.isIframed = true;
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  storeBuildInfo(platform: PlatformInfo) {
    if (!platform) {
      return;
    }
    if (platform.buildLabel) {
      this.buildLabel = platform.buildLabel;
    }
    if (platform.buildVersion) {
      this.buildVersion = platform.buildVersion;
    }
    if (platform.buildId) {
      this.buildId = platform.buildId;
    }
    if (platform.logoutUrl) {
      this.backendService.setLogoutLink(platform.logoutUrl);
    }
  }

  computeBuildValue(label: string, buildValue: string): string {
    return `${label} ${buildValue}`;
  }

  storeDashboardLinks(links: DashboardLinks) {
    const { menuLinks, externalLinks, quickLinks, documentationItems } = links;
    this.menuLinks = menuLinks || [];
    this.externalLinks = externalLinks || [];
    this.quickLinks = quickLinks || [];
    this.documentationItems = documentationItems || [];
  }

  getUrlPath(url: string, ns: string) {
    // Remove fragment from URL
    if (!url) return;
    url = url?.split('#')[0];
    url = this.appendPrefix(url);

    if (!ns) {
      return url;
    }

    return url.replace('{ns}', ns);
  }

  getUrlFragment = getUrlFragment;

  appendPrefix(url: string): string {
    return '/_' + url;
  }

  isLinkActive(url: string): boolean {
    let browserUrl = this.router.url;
    browserUrl = removePrefixFrom(browserUrl);
    const browserUrlObject = new URL(browserUrl, window.location.origin);
    browserUrl = browserUrlObject.pathname + browserUrlObject.hash;
    browserUrl = appendBackslash(browserUrl);
    url = appendBackslash(url);
    return browserUrl.startsWith(url);
  }

  public getNamespaceParams(ns: string): Params | null {
    let params: Params = {};
    if (ns) {
      params['ns'] = ns;
    }
    return params;
  }
}
