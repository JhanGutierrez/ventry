import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionManager } from '@core/services/session-manager';
import { LogOut, LucideAngularModule, LucideIconData, PanelRight } from 'lucide-angular';
import { SidebarOptions, SIDEBAR_ROUTES } from 'src/app/consts/sidebar-routes';

@Component({
  selector: 'sidebar',
  imports: [LucideAngularModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  public readonly sidebarIcon = signal<LucideIconData>(PanelRight);
  public readonly logOutIcon = signal<LucideIconData>(LogOut);
  sessionManager = inject(SessionManager);

  public options = signal<SidebarOptions[]>(SIDEBAR_ROUTES);
  public expand = signal<boolean>(true);

  onLogout() {
    this.sessionManager.logout();
  }
}