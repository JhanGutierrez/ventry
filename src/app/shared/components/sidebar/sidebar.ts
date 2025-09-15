import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LucideIconData, PanelRight } from 'lucide-angular';
import { SidebarOptions, SIDEBAR_ROUTES } from 'src/app/consts/sidebar-routes';

@Component({
  selector: 'sidebar',
  imports: [LucideAngularModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  public readonly sidebarIcon = signal<LucideIconData>(PanelRight);

  public options = signal<SidebarOptions[]>(SIDEBAR_ROUTES);
  public expand = signal<boolean>(true);
}