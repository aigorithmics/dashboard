import { Component, inject, OnDestroy, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { CDBBackendService } from 'src/app/services/backend.service';
import { CDBNamespaceService } from 'src/app/services/namespace.service';
import { Namespace } from 'src/app/types/namespace';

@Component({
    selector: 'app-namespace-selector',
    templateUrl: './namespace-selector.component.html',
    styleUrls: ['./namespace-selector.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class NamespaceSelectorComponent implements OnInit, OnDestroy {
  readonly NO_NAMESPACES = 'No namespaces';

  public logoutUrl = signal<string>('');

  public namespaces: Namespace[];
  public selectedNamespace: Namespace = { namespace: this.NO_NAMESPACES };

  public get namespacesAvailable(): boolean {
    // Use ">1" because we always have the "all namespaces" option.
    return this.namespaces?.length > 1;
  }

  public sub = new Subscription();
  private backendService = inject(CDBBackendService);
  private ns = inject(CDBNamespaceService);
  public ALL_NAMESPACES = this.ns.ALL_NAMESPACES;

  constructor() {}

  ngOnInit(): void {
    this.sub.add(this.ns.namespaces.subscribe((namespaces: Namespace[]) => {
      this.namespaces = namespaces;
    }));

    this.sub.add(this.ns.currentNamespace.subscribe((namespace: Namespace) => {
      this.selectedNamespace = namespace;
    }));

    this.logoutUrl.set(this.backendService.logoutUrl());
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onSelectNamespace(selected: MatSelectChange) {
    if (!selected) {
      return;
    }
    this.ns.selectNamespace(selected.value as Namespace);
  }

  isSelectedNamespaceOwner(): boolean {
    const namespaceObject = this.ns.getNamespaceObject(
      this.selectedNamespace.namespace,
      this.namespaces,
    );
    return this.isOwner(namespaceObject?.role);
  }

  isOwner(role: string | undefined): boolean {
    return role === 'owner';
  }

  compareWith(o1: Namespace, o2: Namespace): boolean {
    return o1.namespace === o2.namespace;
  }
}
