(function() {
  const cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey || cfg.url.includes('TU_PROYECTO')) {
    console.warn('Supabase: configura supabase-config.js primero');
    window.SUPABASE = null;
    return;
  }

  const { createClient } = window.supabase || {};
  if (!createClient) {
    console.warn('Supabase: @supabase/supabase-js no cargado');
    window.SUPABASE = null;
    return;
  }

  const supabase = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false }
  });

  const TABLES = {
    tasks: 'tareas',
    users: 'usuarios',
    delays: 'demoras',
    sessions: 'sesiones'
  };

  function normalizeTask(record) {
    if (!record || !record.id) return null;
    return {
      ...record,
      fecha: record.fecha ? String(record.fecha).slice(0, 10) : '',
      prio: !!record.prio,
      pOrder: record.pOrder === null || record.pOrder === '' ? null : Number(record.pOrder),
      delayActive: !!record.delayActive,
      delayCount: Number(record.delayCount) || 0,
      delayTotalMinutes: Number(record.delayTotalMinutes) || 0
    };
  }

  function normalizeUser(record) {
    if (!record || !record.id || !record.nombre) return null;
    return {
      id: record.id,
      nm: record.nombre,
      rl: record.rol === 'admin' ? 'Administrador' : 'Operativo',
      dep: record.dep,
      ini: initials(record.nombre),
      clr: colorFromId(record.id),
      rol: record.rol,
      activo: record.activo !== false
    };
  }

  window.SUPABASE = {
    async loadUsers() {
      const { data, error } = await supabase
        .from(TABLES.users)
        .select('*')
        .order('nombre');

      if (error) throw new Error(error.message);
      return (data || []).map(normalizeUser).filter(Boolean);
    },

    async saveUser(userData) {
      const user = {
        id: userData.id || ('usr_' + crypto.randomUUID().slice(0, 8)),
        nombre: userData.nombre || userData.nm,
        rol: userData.rol || 'operativo',
        dep: userData.dep || 'fabrica',
        activo: userData.activo !== false
      };

      if (userData.pin && user.rol === 'admin') {
        const enc = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(userData.pin));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        user.pin_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const { error } = await supabase
        .from(TABLES.users)
        .upsert(user, { onConflict: 'id' });

      if (error) throw new Error(error.message);
      return normalizeUser(user);
    },

    async loadTasks() {
      const { data, error } = await supabase
        .from(TABLES.tasks)
        .select('*')
        .order('fecha', { ascending: false })
        .order('hi', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []).map(normalizeTask).filter(Boolean);
    },

    async saveTask(task) {
      const record = {
        id: task.id,
        fecha: task.fecha || '',
        tipo: task.tipo || '',
        obs: task.obs || '',
        hi: task.hi || '',
        hf: task.hf || '',
        estado: task.estado || 'pendiente',
        asig: task.asig || '',
        dep: task.dep || 'fabrica',
        prio: !!task.prio,
        pOrder: task.pOrder == null ? null : Number(task.pOrder),
        fCrea: task.fCrea || '',
        fIni: task.fIni || '',
        fFin: task.fFin || '',
        creadoPor: task.creadoPor || '',
        retraso: task.retraso || '',
        delayCount: Number(task.delayCount) || 0,
        delayTotalMinutes: Number(task.delayTotalMinutes) || 0,
        delayActive: !!task.delayActive,
        delayCurrentId: task.delayCurrentId || '',
        delayCurrentStart: task.delayCurrentStart || ''
      };

      const { error } = await supabase
        .from(TABLES.tasks)
        .upsert(record, { onConflict: 'id' });

      if (error) throw new Error(error.message);
      return normalizeTask(record);
    },

    async deleteTask(id) {
      const { error } = await supabase
        .from(TABLES.tasks)
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },

    async loadDelays(taskId) {
      let query = supabase
        .from(TABLES.delays)
        .select('*')
        .order('inicio', { ascending: false });

      if (taskId) query = query.eq('taskId', taskId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },

    async saveDelay(delay) {
      const record = {
        id: delay.id,
        taskId: delay.taskId,
        motivo: delay.motivo || '',
        inicio: delay.inicio || new Date().toISOString(),
        fin: delay.fin || '',
        minutos: Number(delay.minutos) || 0,
        abiertaPor: delay.abiertaPor || '',
        cerradaPor: delay.cerradaPor || '',
        estado: delay.estado || 'activa'
      };

      const { error } = await supabase
        .from(TABLES.delays)
        .upsert(record, { onConflict: 'id' });

      if (error) throw new Error(error.message);
      return record;
    },

    async login(userId, pin) {
      const { data, error } = await supabase
        .rpc('login_usuario', { p_id: userId, p_pin: pin || '' });

      if (error) throw new Error(error.message);
      if (data.status === 'error') throw new Error(data.message);
      return { user: data.user, token: data.token };
    },

    async validateSession(token) {
      const { data, error } = await supabase
        .rpc('validar_sesion', { p_token: token });

      if (error) throw new Error(error.message);
      if (data.status === 'error') throw new Error(data.message);
      return { user: data.user };
    },

    async loadAll() {
      const [users, tasks] = await Promise.all([
        this.loadUsers(),
        this.loadTasks()
      ]);
      return { users, tasks };
    },

    subscribeToTasks(callback) {
      return supabase
        .channel('tareas_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: TABLES.tasks },
          payload => callback(payload)
        )
        .subscribe();
    },

    closeChannel(subscription) {
      if (subscription) supabase.removeChannel(subscription);
    }
  };

  console.log('Supabase DB Layer initialized');
})();
