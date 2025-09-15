import { ClipboardList, House, LucideIconData, Package, Truck, Warehouse } from 'lucide-angular';

export interface SidebarOptions {
  label: string;
  route: string;
  icon: LucideIconData;
}

export const SIDEBAR_ROUTES: SidebarOptions[] = [
  {
    label: 'Almacenes',
    route: '/warehouses',
    icon: Warehouse,
  },
  {
    label: 'Products',
    route: '/products',
    icon: Package,
  },
  {
    label: 'Inventario',
    route: '/inventory',
    icon: ClipboardList,
  },
  {
    label: 'Movimientos',
    route: '/movements',
    icon: Truck,
  },
];
