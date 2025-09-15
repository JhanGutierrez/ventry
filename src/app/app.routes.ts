import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';
import { Login } from '@pages/auth/login/login';
import { AdminLayout } from '@shared/layouts/admin-layout/admin-layout';
import { AuthLayout } from '@shared/layouts/auth-layout/auth-layout';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: '',
    component: AuthLayout,
    children: [{ path: 'login', component: Login }],
  },
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      { path: 'warehouses', loadComponent: () => import('./pages/admin/warehouse/warehouse').then(m => m.Warehouse) },
      { path: 'products', loadComponent: () => import('./pages/admin/product/product').then(m => m.Product) },
      { path: 'inventory', loadComponent: () => import('./pages/admin/inventory/inventory').then(m => m.Inventory) },
      { path: 'movements', loadComponent: () => import('./pages/admin/movements/movements').then(m => m.Movements) },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
