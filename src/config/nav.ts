import {
  LayoutDashboard,
  ClipboardList,
  FileBarChart,
  Truck,
  Package,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavChild {
  label: string;
  to: string;
  badgeKey?: 'pendientes' | 'revision' | 'verificados';
}

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export const NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Incidencias',
    to: '/incidents',
    icon: ClipboardList,
    children: [
      { label: 'Nueva incidencia', to: '/incidents/new' },
      { label: 'Todas', to: '/incidents' },
      { label: 'Pendientes', to: '/incidents/pending', badgeKey: 'pendientes' },
      { label: 'En revisión', to: '/incidents/review', badgeKey: 'revision' },
      { label: 'Verificadas', to: '/incidents/verified', badgeKey: 'verificados' },
      { label: 'En resolución', to: '/incidents/resolution' },
      { label: 'Terminadas', to: '/incidents/completed' },
    ],
  },
  { label: 'Reportes', to: '/reports', icon: FileBarChart },
  { label: 'Proveedores', to: '/suppliers', icon: Truck },
  { label: 'Productos', to: '/products', icon: Package },
  { label: 'Auditoría', to: '/audit', icon: ShieldCheck },
  { label: 'Configuración', to: '/settings', icon: Settings },
];
