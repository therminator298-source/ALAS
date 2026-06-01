// ============================================================
//  Calendario Tareas — ALAS | constants.js
//  Datos de configuraci\u00f3n est\u00e1ticos (sin dependencias externas)
// ============================================================

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','S\u00e1b','Octubre','Noviembre','Diciembre'];

const DAYS = ['Dom','Lun','Mar','Mi\u00e9','Jue','Vie','S\u00e1b'];

const USER_COLORS = [
  '#0066CC','#8B5CF6','#10B981','#F59E0B','#EF4444',
  '#06B6D4','#EAB308','#EC4899','#334155','#0F766E'
];

const ACTIVITY_TYPES = [
  { id:'descarga',           nm:'Descarga',                     c:'#0066CC', i:'↓',  dep:['deposito','fabrica'] },
  { id:'reposicion',         nm:'Reposici\u00f3n',                   c:'#8B5CF6', i:'⟳',  dep:['deposito','fabrica'] },
  { id:'chatarra',           nm:'Chatarra',                     c:'#F59E0B', i:'♻',  dep:['fabrica'] },
  { id:'arreglo',            nm:'Arreglo',                      c:'#EF4444', i:'🔧', dep:['deposito','fabrica'] },
  { id:'ruteo_peri',         nm:'Ruteo Periferia',              c:'#10B981', i:'◎',  dep:['fabrica'] },
  { id:'ruteo_int',          nm:'Ruteo Interior',               c:'#06B6D4', i:'◉',  dep:['fabrica'] },
  { id:'atencion_cliente',   nm:'Atenci\u00f3n al Cliente',          c:'#ec4899',
    i:'<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    dep:['fabrica'] },
  { id:'carga_basura',       nm:'Carga de Basura',              c:'#737373', i:'🗑', dep:['deposito'] },
  { id:'fab_transportadora', nm:'Transportadora',               c:'#F97316',
    i:'<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3.5V19h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    dep:['fabrica'] },
  { id:'repos_almacenes',    nm:'Reposiciones entre Almacenes', c:'#6366F1', i:'⇄',  dep:['deposito','fabrica'] },
  { id:'otras',              nm:'Otras Actividades',            c:'#64748B', i:'★',  dep:['deposito','fabrica'] }
];

const STATUSES = {
  pendiente:  { nm:'Pendiente',  c:'#F59E0B', bg:'rgba(245,158,11,.12)',  tc:'#D97706', i:'⏳' },
  en_proceso: { nm:'En Proceso', c:'#0066CC', bg:'rgba(0,102,204,.12)',   tc:'#0055BB', i:'▶'  },
  terminado:  { nm:'Terminado',  c:'#10B981', bg:'rgba(16,185,129,.12)',  tc:'#059669', i:'✓'  }
};

const HELMET_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="#1565c0"><path d="M10,100 C10,75 25,60 40,55 C45,70 55,70 60,55 C75,60 90,75 90,100 Z" /></g><g fill="#fff"><rect x="25" y="80" width="50" height="20" /><rect x="30" y="60" width="10" height="20" /><rect x="60" y="60" width="10" height="20" /></g><g fill="#1565c0"><rect x="32" y="85" width="6" height="3" /><rect x="32" y="91" width="6" height="3" /><rect x="62" y="85" width="6" height="3" /><rect x="62" y="91" width="6" height="3" /><path d="M30,35 C30,60 70,60 70,35" fill="none" stroke="#1565c0" stroke-width="7" /><path d="M20,35 C20,30 25,30 28,30 L72,30 C75,30 80,30 80,35 Z" /><path d="M30,30 C30,0 70,0 70,30 Z" /></g><g fill="#fff"><rect x="47" y="5" width="6" height="15" rx="2" /><rect x="35" y="10" width="4" height="12" rx="2" /><rect x="61" y="10" width="4" height="12" rx="2" /></g></svg>`;

const PRIORITY_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:text-bottom"><circle cx="12" cy="12" r="10" fill="#dc2626" stroke="#fff" stroke-width="2"/><path d="M12 7v5m0 4h.01" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
