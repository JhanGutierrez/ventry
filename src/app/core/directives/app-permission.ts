import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthClient } from '@core/services/auth-client';
import { SessionManager } from '@core/services/session-manager';

@Directive({
  selector: '[appAppPermission]',
})
export class AppPermission {
  templateRef = inject(TemplateRef<any>);
  vcr = inject(ViewContainerRef);
  sessionManager = inject(SessionManager);

  appAppPermission = input.required<string[]>();

  private roles: string[] = [];

  constructor() {
    effect(() => {
      if (this.appAppPermission().length > 0) {
        this.roles = this.appAppPermission();
        this.updateView();
      }
    });
  }

  private updateView() {
    const currentUser = this.sessionManager.currentUser();
    const roles = currentUser?.['https://hasura.io/jwt/claims']['x-hasura-allowed-roles'] || [];

    if (this.roles.some((r) => roles.includes(r))) {
      this.vcr.createEmbeddedView(this.templateRef);
    } else {
      this.vcr.clear();
    }
  }
}
