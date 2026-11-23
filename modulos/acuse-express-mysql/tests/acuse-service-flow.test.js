require('./test-env');

const test = require('node:test');
const assert = require('node:assert/strict');

const acuseService = require('../server/services/acuseService');

const {
  createAcuseFlow,
  updateAcuseFlow,
  changeEstadoFlow,
  deactivateAcuseFlow
} = acuseService.__test__;

function createConnectionRecorder() {
  const calls = [];
  return {
    calls,
    async execute(sql, params) {
      calls.push({ sql, params });
      if (/INSERT INTO .*acuse/i.test(sql)) {
        return [{ insertId: 42 }];
      }
      return [{ affectedRows: 1 }];
    }
  };
}

function createTransactionStub(connection) {
  return async (work) => work(connection);
}

test('createAcuseFlow inserta cabecera, detalles, historial, log y devuelve el acuse final', async () => {
  const connection = createConnectionRecorder();
  const data = {
    Nro_Acuse: null,
    Cod_Cliente: 'CLI-001',
    Estado: 'Pendiente',
    Fecha_Emision: '2026-04-24',
    Fecha_Entrega: null,
    ID_Repartidor: 7,
    Observacion: 'Entrega AM',
    Usuario: 'Tester',
    Zona: 'ASUNCION',
    Activo: 1,
    detalles: [
      { Cod_Mercaderia: 'MAT-01', Cantidad: 3, UM: 'CJ', Nota: 'Fragil' },
      { Cod_Mercaderia: 'MAT-02', Cantidad: 1, UM: 'UN', Nota: null }
    ]
  };

  const result = await createAcuseFlow({ any: 'payload' }, {
    normalizeAcusePayload: async () => data,
    withTransaction: createTransactionStub(connection),
    insertDetalles: async (conn, id, detalles) => conn.calls.push({ op: 'insertDetalles', id, detalles }),
    insertHistorial: async (conn, id, estado, usuario, observacion) => conn.calls.push({ op: 'insertHistorial', id, estado, usuario, observacion }),
    insertLog: async (conn, id, accion, usuario, observacion) => conn.calls.push({ op: 'insertLog', id, accion, usuario, observacion }),
    getAcuse: async (id, conn) => ({ ID_Acuse: id, Nro_Acuse: 'AC-0042', checkedWith: conn === connection }),
    now: () => 1234567890,
    random: () => 0.1234
  });

  assert.equal(result.ID_Acuse, 42);
  assert.equal(result.Nro_Acuse, 'AC-0042');

  const insertCall = connection.calls.find((item) => item.sql && /INSERT INTO .*acuse/i.test(item.sql));
  assert.ok(insertCall);
  assert.equal(insertCall.params[1], 'CLI-001');
  assert.equal(insertCall.params[2], 'Pendiente');

  const updateNumberCall = connection.calls.find((item) => item.sql && /SET Nro_Acuse = \?/i.test(item.sql));
  assert.ok(updateNumberCall);
  assert.deepEqual(updateNumberCall.params, ['AC-0042', 42]);

  const insertDetallesCall = connection.calls.find((item) => item.op === 'insertDetalles');
  assert.ok(insertDetallesCall);
  assert.equal(insertDetallesCall.id, 42);
  assert.equal(insertDetallesCall.detalles.length, 2);

  const historialCall = connection.calls.find((item) => item.op === 'insertHistorial');
  assert.deepEqual(historialCall, {
    op: 'insertHistorial',
    id: 42,
    estado: 'Pendiente',
    usuario: 'Tester',
    observacion: 'Creacion del acuse'
  });

  const logCall = connection.calls.find((item) => item.op === 'insertLog');
  assert.deepEqual(logCall, {
    op: 'insertLog',
    id: 42,
    accion: 'CREAR',
    usuario: 'Tester',
    observacion: 'Acuse creado desde modulo web'
  });
});

test('updateAcuseFlow actualiza cabecera, reemplaza detalle y registra historial si cambia el estado', async () => {
  const connection = createConnectionRecorder();
  const data = {
    Nro_Acuse: null,
    Cod_Cliente: 'CLI-099',
    Estado: 'Entregado',
    Fecha_Emision: '2026-04-24',
    Fecha_Entrega: '2026-04-24 10:00:00',
    ID_Repartidor: 8,
    Observacion: 'Actualizado',
    Usuario: 'Supervisor',
    Zona: 'CENTRO',
    Activo: 1,
    detalles: [{ Cod_Mercaderia: 'MAT-77', Cantidad: 5, UM: 'CJ', Nota: 'Nuevo' }]
  };

  const result = await updateAcuseFlow(10, { payload: true }, {
    getAcuse: async (id, conn) => {
      if (!conn) return { ID_Acuse: id, Nro_Acuse: 'AC-0010', Estado: 'Pendiente' };
      return { ID_Acuse: id, Nro_Acuse: 'AC-0010', Estado: 'Entregado' };
    },
    normalizeAcusePayload: async () => data,
    withTransaction: createTransactionStub(connection),
    insertDetalles: async (conn, id, detalles) => conn.calls.push({ op: 'insertDetalles', id, detalles }),
    insertHistorial: async (conn, id, estado, usuario, observacion) => conn.calls.push({ op: 'insertHistorial', id, estado, usuario, observacion }),
    insertLog: async (conn, id, accion, usuario, observacion) => conn.calls.push({ op: 'insertLog', id, accion, usuario, observacion })
  });

  assert.equal(result.ID_Acuse, 10);

  const updateCall = connection.calls.find((item) => item.sql && /UPDATE[\s\S]*SET Nro_Acuse = \?/i.test(item.sql));
  assert.ok(updateCall);
  assert.deepEqual(updateCall.params, [
    'AC-0010',
    'CLI-099',
    'Entregado',
    '2026-04-24',
    '2026-04-24 10:00:00',
    8,
    'Actualizado',
    'CENTRO',
    1,
    10
  ]);

  const deleteDetailCall = connection.calls.find((item) => item.sql && /DELETE FROM .*ID_Acuse = \?/i.test(item.sql));
  assert.ok(deleteDetailCall);
  assert.deepEqual(deleteDetailCall.params, [10]);

  const historialCall = connection.calls.find((item) => item.op === 'insertHistorial');
  assert.deepEqual(historialCall, {
    op: 'insertHistorial',
    id: 10,
    estado: 'Entregado',
    usuario: 'Supervisor',
    observacion: 'Cambio de estado desde edicion'
  });

  const logCall = connection.calls.find((item) => item.op === 'insertLog');
  assert.deepEqual(logCall, {
    op: 'insertLog',
    id: 10,
    accion: 'EDITAR',
    usuario: 'Supervisor',
    observacion: 'Acuse actualizado desde modulo web'
  });
});

test('changeEstadoFlow actualiza estado, fecha de entrega y registra auditoria', async () => {
  const connection = createConnectionRecorder();

  const result = await changeEstadoFlow(25, {
    Estado: 'en tránsito',
    Fecha_Entrega: '2026-04-24 14:30:00',
    Usuario: 'Operador',
    Observacion: 'Salida a ruta'
  }, {
    getAcuse: async (id, conn) => ({ ID_Acuse: id, Estado: conn ? 'En Reparto' : 'Pendiente' }),
    withTransaction: createTransactionStub(connection),
    insertHistorial: async (conn, id, estado, usuario, observacion) => conn.calls.push({ op: 'insertHistorial', id, estado, usuario, observacion }),
    insertLog: async (conn, id, accion, usuario, observacion) => conn.calls.push({ op: 'insertLog', id, accion, usuario, observacion })
  });

  assert.equal(result.Estado, 'En Reparto');

  const updateCall = connection.calls.find((item) => item.sql && /SET Estado = \?/i.test(item.sql));
  assert.ok(updateCall);
  assert.deepEqual(updateCall.params, ['En Reparto', '2026-04-24 14:30:00', '2026-04-24 14:30:00', 25]);

  const historialCall = connection.calls.find((item) => item.op === 'insertHistorial');
  assert.deepEqual(historialCall, {
    op: 'insertHistorial',
    id: 25,
    estado: 'En Reparto',
    usuario: 'Operador',
    observacion: 'Salida a ruta'
  });

  const logCall = connection.calls.find((item) => item.op === 'insertLog');
  assert.deepEqual(logCall, {
    op: 'insertLog',
    id: 25,
    accion: 'CAMBIO_ESTADO',
    usuario: 'Operador',
    observacion: 'Salida a ruta'
  });
});

test('deactivateAcuseFlow da de baja logica y registra la anulacion', async () => {
  const connection = createConnectionRecorder();

  const result = await deactivateAcuseFlow(30, {
    Usuario: 'Admin',
    Observacion: 'Cliente duplicado'
  }, {
    getAcuse: async (id) => ({ ID_Acuse: id, Estado: 'Pendiente' }),
    withTransaction: createTransactionStub(connection),
    insertHistorial: async (conn, id, estado, usuario, observacion) => conn.calls.push({ op: 'insertHistorial', id, estado, usuario, observacion }),
    insertLog: async (conn, id, accion, usuario, observacion) => conn.calls.push({ op: 'insertLog', id, accion, usuario, observacion })
  });

  assert.deepEqual(result, { ok: true, Estado: 'Anulado', legacyFallback: false });

  const updateCall = connection.calls.find((item) => item.sql && /SET Estado = \?/i.test(item.sql));
  assert.ok(updateCall);
  assert.deepEqual(updateCall.params, ['Anulado', 30]);

  const historialCall = connection.calls.find((item) => item.op === 'insertHistorial');
  assert.deepEqual(historialCall, {
    op: 'insertHistorial',
    id: 30,
    estado: 'Anulado',
    usuario: 'Admin',
    observacion: 'Cliente duplicado'
  });

  const logCall = connection.calls.find((item) => item.op === 'insertLog');
  assert.deepEqual(logCall, {
    op: 'insertLog',
    id: 30,
    accion: 'ANULAR',
    usuario: 'Admin',
    observacion: 'Cliente duplicado'
  });
});

test('deactivateAcuseFlow rechaza anular un acuse entregado', async () => {
  await assert.rejects(
    () => deactivateAcuseFlow(44, {
      Usuario: 'Admin',
      Observacion: 'Cliente solicito anulacion'
    }, {
      getAcuse: async () => ({ ID_Acuse: 44, Estado: 'Entregado' })
    }),
    /no puede anularse/i
  );
});

test('updateAcuseFlow rechaza editar un acuse anulado', async () => {
  await assert.rejects(
    () => updateAcuseFlow(18, { payload: true }, {
      getAcuse: async () => ({ ID_Acuse: 18, Estado: 'Anulado' }),
      normalizeAcusePayload: async () => ({})
    }),
    /no puede editarse/i
  );
});

test('changeEstadoFlow rechaza cambiar el estado de un acuse anulado', async () => {
  await assert.rejects(
    () => changeEstadoFlow(19, {
      Estado: 'Pendiente',
      Usuario: 'Supervisor'
    }, {
      getAcuse: async () => ({ ID_Acuse: 19, Estado: 'Anulado' })
    }),
    /no puede cambiar de estado/i
  );
});
