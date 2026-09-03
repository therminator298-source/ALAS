import { supabase } from '@/lib/supabase';
import type { Supplier, Product, Warehouse } from '@/types';

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'm-s1', nombre: 'ORION S.R.L.', ruc: '80012345-6' },
  { id: 'm-s2', nombre: 'ATLANTIC S.A.E.', ruc: '80023456-7' },
  { id: 'm-s3', nombre: 'ZR DISTRIBUIDORA', ruc: '80034567-8' },
  { id: 'm-s4', nombre: 'FORTLEV INDUSTRIA E COMERCIO LTDA', ruc: '80045678-9' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'm-p1', codigo: 'LA9100102', descripcion: 'TAPA WATER TPQ MARR. OSC. CM1', um: 'UN' },
  { id: 'm-p2', codigo: 'LA02020010', descripcion: 'TANQUE AGUA C/TAPA 5.000L FORTLEV', um: 'UN' },
  { id: 'm-p3', codigo: 'LA6901998', descripcion: 'GUANTE DE CUERO CAÑO LARGO', um: 'PAR' },
];

const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'm-w1', nombre: 'Fábrica', codigo: 'FAB' },
  { id: 'm-w2', nombre: 'Depósito Central', codigo: 'DEP-CEN' },
  { id: 'm-w3', nombre: 'Depósito Luque Sanber', codigo: 'DEP-LUQ' },
];

export async function listSuppliers(): Promise<Supplier[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id,nombre,ruc')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as Supplier[]; // datos reales (aunque esté vacío: correr seed_demo.sql)
    } catch (e) {
      console.warn('[catalogs] suppliers fallback mock:', (e as Error).message);
    }
  }
  return MOCK_SUPPLIERS;
}

export async function listWarehouses(): Promise<Warehouse[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id,nombre,codigo')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as Warehouse[];
    } catch (e) {
      console.warn('[catalogs] warehouses fallback mock:', (e as Error).message);
    }
  }
  return MOCK_WAREHOUSES;
}

export interface ProductPage {
  rows: Product[];
  total: number;
  live: boolean;
}

/** Catálogo paginado con búsqueda server-side (código o descripción). */
export async function listProducts(term: string, page = 1, pageSize = 50): Promise<ProductPage> {
  const t = term.trim();
  if (supabase) {
    try {
      let q = supabase
        .from('products')
        .select('id,codigo,descripcion,ean,sku,um', { count: 'exact' })
        .order('codigo');
      if (t) q = q.or(`codigo.ilike.%${t}%,descripcion.ilike.%${t}%`);
      const from = (page - 1) * pageSize;
      q = q.range(from, from + pageSize - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data as Product[]) ?? [], total: count ?? 0, live: true };
    } catch (e) {
      console.warn('[catalogs] listProducts fallback mock:', (e as Error).message);
    }
  }
  const lo = t.toLowerCase();
  const filtered = MOCK_PRODUCTS.filter(
    (p) => !lo || p.codigo.toLowerCase().includes(lo) || p.descripcion.toLowerCase().includes(lo),
  );
  const start = (page - 1) * pageSize;
  return { rows: filtered.slice(start, start + pageSize), total: filtered.length, live: false };
}

export async function searchProducts(term: string): Promise<Product[]> {
  const t = term.trim();
  if (supabase) {
    try {
      let q = supabase.from('products').select('id,codigo,descripcion,ean,sku,um').eq('activo', true).limit(20);
      if (t) q = q.or(`codigo.ilike.%${t}%,descripcion.ilike.%${t}%,ean.ilike.%${t}%,sku.ilike.%${t}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data as Product[]) ?? [];
    } catch (e) {
      console.warn('[catalogs] products fallback mock:', (e as Error).message);
    }
  }
  const lo = t.toLowerCase();
  return MOCK_PRODUCTS.filter(
    (p) => !lo || p.codigo.toLowerCase().includes(lo) || p.descripcion.toLowerCase().includes(lo),
  );
}
