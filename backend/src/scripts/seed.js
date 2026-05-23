require('dotenv').config();
const supabase = require('../config/supabase');

async function seed() {
  console.log('🚀 Iniciando la carga de datos de demostración en Supabase...');

  try {
    // 1. Limpiar transacciones antiguas
    console.log('🧹 Limpiando tablas transaccionales...');
    await supabase.from('asistencias').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('incidentes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cobros').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('servicios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('documentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('turnos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('choferes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('operadoras').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Limpiar usuarios excepto el administrador superusuario para no perder su rol
    await supabase.from('users_roles').delete().neq('email', 'koffy69309970@gmail.com');

    // 2. Insertar usuarios autorizados (4 operadoras, 3 administrativas, 1 demo, y asegurar admin)
    console.log('👥 Insertando usuarios y roles...');
    const userEmails = [
      { email: 'koffy69309970@gmail.com', role: 'admin', nombre: 'Kevin Flores (Admin)', activo: true },
      { email: 'prueba@gmail.com', role: 'admin', nombre: 'Usuario de Prueba (Demo)', activo: true },
      // 4 Operadoras
      { email: 'ana@plusmovil.com', role: 'operadora', nombre: 'Ana García', activo: true },
      { email: 'sofia@plusmovil.com', role: 'operadora', nombre: 'Sofia Cardozo', activo: true },
      { email: 'patricia@plusmovil.com', role: 'operadora', nombre: 'Patricia Mamani', activo: true },
      { email: 'laura@plusmovil.com', role: 'operadora', nombre: 'Laura Fernandez', activo: true },
      // 3 Administrativas
      { email: 'maria@plusmovil.com', role: 'contadora', nombre: 'María López', activo: true },
      { email: 'ricardo@plusmovil.com', role: 'contadora', nombre: 'Ricardo Soliz', activo: true },
      { email: 'gabriela@plusmovil.com', role: 'contadora', nombre: 'Gabriela Quiroga', activo: true }
    ];

    const { data: users, error: usersErr } = await supabase
      .from('users_roles')
      .upsert(userEmails, { onConflict: 'email' })
      .select();

    if (usersErr) throw usersErr;
    console.log(`✅ ${users.length} usuarios creados/actualizados.`);

    // 3. Insertar Operadoras vinculadas
    console.log('👩‍💼 Registrando operadoras vinculadas...');
    const opUsers = users.filter(u => u.role === 'operadora');
    const operadorasData = opUsers.map((u, i) => ({
      user_id: u.id,
      nombre: u.nombre,
      telefono: `+591 76${900000 + i}`,
      activa: true
    }));

    const { data: operadoras, error: opErr } = await supabase
      .from('operadoras')
      .insert(operadorasData)
      .select();

    if (opErr) throw opErr;
    console.log(`✅ ${operadoras.length} registros de operadoras completados.`);

    // 4. Insertar 15 Choferes y móviles
    console.log('🚗 Registrando choferes y vehículos de prueba...');
    const choferesNames = [
      { nombre: 'Carlos Mendoza', ci: '4561234', movil: '201', socio: true },
      { nombre: 'Juan Pérez', ci: '1234567', movil: '202', socio: true },
      { nombre: 'Roberto Flores', ci: '3456789', movil: '203', socio: false },
      { nombre: 'Miguel Torres', ci: '7891234', movil: '204', socio: true },
      { nombre: 'Pedro Vargas', ci: '5678901', movil: '205', socio: false },
      { nombre: 'Alejandro Ruiz', ci: '6543210', movil: '206', socio: true },
      { nombre: 'Javier Condori', ci: '8765432', movil: '207', socio: false },
      { nombre: 'Fernando Choque', ci: '9876543', movil: '208', socio: true },
      { nombre: 'Mario Gutierrez', ci: '5432109', movil: '209', socio: false },
      { nombre: 'Luis Mamani', ci: '2109876', movil: '210', socio: true },
      { nombre: 'David Quispe', ci: '1098765', movil: '211', socio: true },
      { nombre: 'Wilson Altamirano', ci: '3210987', movil: '212', socio: false },
      { nombre: 'José Ortiz', ci: '4321098', movil: '213', socio: true },
      { nombre: 'Christian Bejarano', ci: '8901234', movil: '214', socio: false },
      { nombre: 'Ronald Castro', ci: '9012345', movil: '215', socio: true }
    ];

    const choferesData = choferesNames.map((c, i) => ({
      nombre: c.nombre,
      ci: c.ci,
      telefono: `+591 70${200000 + i}`,
      telefono_emergencia: `+591 70${300000 + i}`,
      tipo_sangre: ['ORH+', 'ORH-', 'ARH+', 'BRH+'][i % 4],
      es_socio: c.socio,
      numero_movil: c.movil,
      estado: i === 5 ? 'inactivo' : i === 11 ? 'suspendido' : 'activo',
      notas: i === 11 ? 'Suspendido temporalmente por falta al uniforme.' : 'Conductor de pruebas CRM.'
    }));

    const { data: choferes, error: chfErr } = await supabase
      .from('choferes')
      .insert(choferesData)
      .select();

    if (chfErr) throw chfErr;
    console.log(`✅ ${choferes.length} choferes creados.`);

    // 5. Insertar 20 Clientes
    console.log('👥 Creando directorio de clientes...');
    const clientesNames = [
      { nombre: 'Valeria Aramayo', zona: 'El Molino' },
      { nombre: 'Ramiro Ortega', zona: 'San Roque' },
      { nombre: 'Silvia Zenteno', zona: 'Senac' },
      { nombre: 'Oscar Lema', zona: 'La Pampa' },
      { nombre: 'Patricia Cardozo', zona: 'Miraflores' },
      { nombre: 'Andres Vaca', zona: 'Tabladita' },
      { nombre: 'Camila Avila', zona: 'Fatima' },
      { nombre: 'Jorge Romero', zona: 'Centro' },
      { nombre: 'Liliana Castillo', zona: 'Morros Blancos' },
      { nombre: 'Esteban Mendez', zona: 'Aeropuerto' },
      { nombre: 'Martha Lopez', zona: 'Las Panosas' },
      { nombre: 'Gustavo Soliz', zona: 'San Martin' },
      { nombre: 'Nelly Choque', zona: 'Cuchipampa' },
      { nombre: 'Fernando Torrico', zona: 'Luis de Fuentes' },
      { nombre: 'Daniela Gutierrez', zona: 'El Portillo' },
      { nombre: 'Hugo Bejarano', zona: 'Aranjuez' },
      { nombre: 'Renato Ruiz', zona: 'Geronimo de Osorio' },
      { nombre: 'Paola Miranda', zona: 'Juan XXIII' },
      { nombre: 'Victor Cruz', zona: 'El Constructor' },
      { nombre: 'Rosa Guzman', zona: 'La Loma' }
    ];

    const clientesData = clientesNames.map((c, i) => ({
      numero_whatsapp: `59175${600000 + i}`,
      nombre: c.nombre,
      zona: c.zona,
      historial_servicios: Math.floor(Math.random() * 30) + 5,
      blacklist: i === 8, // Una blacklist de ejemplo
      notas: i === 8 ? 'Cliente conflictivo reportado por móvil 203.' : 'Cliente regular.'
    }));

    const { data: clientes, error: cliErr } = await supabase
      .from('clientes')
      .insert(clientesData)
      .select();

    if (cliErr) throw cliErr;
    console.log(`✅ ${clientes.length} clientes creados.`);

    // 6. Insertar Turnos Históricos (últimos 30 días)
    console.log('📅 Generando turnos históricos de 30 días...');
    const turnosData = [];
    const now = new Date();

    for (let d = 30; d >= 0; d--) {
      const date = new Date();
      date.setDate(now.getDate() - d);
      
      const isToday = d === 0;
      
      // 2 turnos por día (mañana y tarde)
      const op = operadoras[d % operadoras.length];
      
      turnosData.push({
        operadora_id: op.id,
        fecha: date.toISOString().split('T')[0],
        hora_inicio: '06:00:00',
        hora_fin: isToday ? null : '14:00:00',
        estado: isToday ? 'activo' : 'cerrado',
        resumen: isToday ? {} : {
          servicios_completados: Math.floor(Math.random() * 15) + 10,
          total_recaudado: Math.floor(Math.random() * 300) + 150
        },
        notas: `Turno de fecha ${date.toLocaleDateString()}`
      });
    }

    const { data: turnos, error: trnErr } = await supabase
      .from('turnos')
      .insert(turnosData)
      .select();

    if (trnErr) throw trnErr;
    console.log(`✅ ${turnos.length} turnos históricos inicializados.`);

    // 7. Insertar Servicios históricos (últimos 30 días)
    console.log('🚕 Generando 120 servicios históricos...');
    const serviciosData = [];
    const activeTurnos = turnos.filter(t => t.estado === 'cerrado');
    const activeChoferes = choferes.filter(c => c.estado === 'activo');
    const zonasTarija = ['Centro', 'La Pampa', 'San Roque', 'El Molino', 'Senac', 'Miraflores', 'Fátima', 'Juan XXIII', 'Las Panosas', 'La Loma'];
    
    // 120 servicios
    for (let s = 0; s < 120; s++) {
      const turn = turnos[s % turnos.length];
      const chf = activeChoferes[s % activeChoferes.length];
      const cli = clientes[s % clientes.length];
      
      // Fecha en base al turno
      const date = new Date(turn.fecha);
      date.setHours(8 + (s % 8), Math.floor(Math.random() * 60), 0);

      const estado = s < 5 && turn.estado === 'activo' 
        ? 'pendiente' 
        : s % 10 === 0 
          ? 'cancelado' 
          : s % 15 === 0 
            ? 'en_curso' 
            : 'completado';

      serviciosData.push({
        cliente_id: cli.id,
        chofer_id: estado !== 'pendiente' ? chf.id : null,
        operadora_id: turn.operadora_id,
        turno_id: turn.id,
        fecha_hora: date.toISOString(),
        zona: cli.zona || zonasTarija[s % zonasTarija.length],
        destino: zonasTarija[(s + 3) % zonasTarija.length],
        estado: estado,
        tiempo_respuesta: estado === 'completado' ? Math.floor(Math.random() * 12) + 3 : null,
        monto: estado === 'completado' ? [12, 15, 20, 25, 30][s % 5] : 0.00,
        gps_lat: -21.535 + (Math.random() * 0.02 - 0.01),
        gps_lng: -64.730 + (Math.random() * 0.02 - 0.01),
        notas: estado === 'cancelado' ? 'Cliente canceló el pedido por demora.' : 'Servicio despachado.'
      });
    }

    const { error: srvErr } = await supabase
      .from('servicios')
      .insert(serviciosData);

    if (srvErr) throw srvErr;
    console.log(`✅ 120 servicios históricos generados.`);

    // 8. Insertar Cobros (150+ cobros distribuidos uniformemente)
    console.log('💰 Generando cobros y multas uniformemente...');
    const cobrosData = [];
    const conceptos = ['Turno Libre', 'Limpieza', 'Multa', 'Otro'];

    // Para cada uno de los 31 turnos generamos entre 4 y 6 cobros para tener un historial completo
    for (let t = 0; t < turnos.length; t++) {
      const turn = turnos[t];
      const numCobros = 5; // 5 cobros por turno constante = 155 cobros en total
      
      for (let c = 0; c < numCobros; c++) {
        const chf = activeChoferes[(t * numCobros + c) % activeChoferes.length];
        const concepto = conceptos[(t * numCobros + c) % conceptos.length];
        
        const date = new Date(turn.fecha);
        // Distribuir horas entre las 8:00 AM y las 13:00 PM para cada cobro del turno
        date.setHours(8 + c, Math.floor(Math.random() * 60), 0);

        let monto = 15.00;
        let notas = 'Cobro administrativo regular.';

        if (concepto === 'Turno Libre') {
          monto = 15.00;
          notas = 'Cobro de turno libre de operación.';
        } else if (concepto === 'Limpieza') {
          monto = 10.00;
          notas = 'Lavado y desinfección diaria del vehículo.';
        } else if (concepto === 'Multa') {
          monto = 20.00;
          notas = c % 2 === 0 ? 'Multa por uniforme incompleto.' : 'Multa por atraso en marcar ingreso.';
        } else if (concepto === 'Otro') {
          monto = 30.00;
          notas = 'Aporte extraordinario administrativo.';
        }

        cobrosData.push({
          chofer_id: chf.id,
          operadora_id: turn.operadora_id,
          turno_id: turn.id,
          concepto: concepto,
          monto: monto,
          fecha_hora: date.toISOString(),
          notas: notas
        });
      }
    }

    const { error: cobErr } = await supabase
      .from('cobros')
      .insert(cobrosData);

    if (cobErr) throw cobErr;
    console.log(`✅ ${cobrosData.length} cobros y multas cargados en base de datos.`);

    // 9. Asistencias de conductores
    console.log('📝 Generando registros de asistencias...');
    const asistenciasData = [];

    for (let a = 0; a < 60; a++) {
      const turn = turnos[a % turnos.length];
      const chf = activeChoferes[a % activeChoferes.length];
      
      const date = new Date(turn.fecha);
      date.setHours(5, 45 + (a % 15), 0);

      asistenciasData.push({
        chofer_id: chf.id,
        turno_id: turn.id,
        hora_entrada: date.toISOString(),
        limpieza: a % 8 !== 0, // Algunas unidades marcadas sin limpieza
        falta: false,
        notas: a % 8 === 0 ? 'Vehículo con suciedad ligera en llantas.' : 'Ingreso correcto.'
      });
    }

    const { error: astErr } = await supabase
      .from('asistencias')
      .insert(asistenciasData);

    if (astErr) throw astErr;
    console.log(`✅ 60 registros de asistencia creados.`);

    // 10. Documentos de Choferes (Alertas SOAT / Licencia)
    console.log('🗂️ Cargando documentos (SOAT, Licencias) y configurando alertas...');
    const documentosData = [];

    choferes.forEach((chf, i) => {
      // SOAT
      const vencimientoSoat = new Date();
      if (i % 5 === 0) {
        vencimientoSoat.setDate(now.getDate() - 10); // Vencido hace 10 días
      } else if (i % 4 === 0) {
        vencimientoSoat.setDate(now.getDate() + 5); // Por vencer en 5 días
      } else {
        vencimientoSoat.setDate(now.getDate() + 200); // Válido por mucho
      }

      documentosData.push({
        chofer_id: chf.id,
        tipo: 'soat',
        fecha_emision: new Date(vencimientoSoat.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fecha_vencimiento: vencimientoSoat.toISOString().split('T')[0],
        archivo_url: null,
        estado: i % 5 === 0 ? 'vencido' : i % 4 === 0 ? 'por_vencer' : 'valido',
        notas: 'SOAT Nacional Plus.'
      });

      // Licencia de Conducir
      const vencimientoLic = new Date();
      if (i % 7 === 0) {
        vencimientoLic.setDate(now.getDate() - 5); // Vencida
      } else {
        vencimientoLic.setDate(now.getDate() + 500); // Válida
      }

      documentosData.push({
        chofer_id: chf.id,
        tipo: 'licencia',
        fecha_emision: new Date(vencimientoLic.getTime() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fecha_vencimiento: vencimientoLic.toISOString().split('T')[0],
        archivo_url: null,
        estado: i % 7 === 0 ? 'vencido' : 'valido',
        notas: 'Categoría Profesional B/C.'
      });
    });

    const { error: docErr } = await supabase
      .from('documentos')
      .insert(documentosData);

    if (docErr) throw docErr;
    console.log(`✅ Licencias y SOAT cargados con estados válidos/por vencer/vencidos.`);

    // 11. Incidentes de Choferes
    console.log('⚠️ Generando incidentes y multas de demostración...');
    const incidentesData = [];
    
    const incidentesTemplates = [
      { tipo: 'falta_uniforme', gravedad: 'leve', desc: 'No portaba la polera distintiva de la empresa durante el turno.', multa: 20.00, estado: 'pendiente' },
      { tipo: 'retraso_turno', gravedad: 'leve', desc: 'Llegada tarde a la marcación de ingreso por 15 minutos.', multa: 10.00, estado: 'pagado' },
      { tipo: 'limpieza_vehiculo', gravedad: 'moderada', desc: 'Interiores con suciedad y olores reportados por pasajero.', multa: 30.00, estado: 'pendiente' },
      { tipo: 'queja_cliente', gravedad: 'moderada', desc: 'Conducir con exceso de velocidad en zona escolar y discutir con el pasajero.', multa: 50.00, estado: 'pendiente' },
      { tipo: 'mal_comportamiento', gravedad: 'grave', desc: 'Maltrato verbal a la operadora al recibir asignación radial.', multa: 50.00, estado: 'pagado' },
      { tipo: 'accidente', gravedad: 'grave', desc: 'Colisión leve en paragolpe delantero por distracción. Sin heridos.', multa: 0.00, estado: 'no_aplica' },
      { tipo: 'falta_uniforme', gravedad: 'leve', desc: 'Uso de calzado no autorizado (chinelas) en horario de servicio.', multa: 20.00, estado: 'pendiente' },
      { tipo: 'otro', gravedad: 'moderada', desc: 'Desvío de ruta sin reportar a la operadora central por radio.', multa: 30.00, estado: 'pagado' }
    ];

    incidentesTemplates.forEach((temp, idx) => {
      const chf = choferes[idx % choferes.length];
      const date = new Date();
      date.setDate(now.getDate() - (idx * 3 + 1));

      incidentesData.push({
        chofer_id: chf.id,
        tipo: temp.tipo,
        descripcion: temp.desc,
        gravedad: temp.gravedad,
        fecha: date.toISOString().split('T')[0],
        monto_multa: temp.multa,
        estado_multa: temp.estado,
        created_at: date.toISOString()
      });
    });

    const { data: insertedIncidents, error: incErr } = await supabase
      .from('incidentes')
      .insert(incidentesData)
      .select();

    if (incErr) throw incErr;
    console.log(`✅ ${insertedIncidents.length} incidentes y multas de prueba creados.`);

    const paidIncidentCobros = insertedIncidents
      .filter(inc => inc.estado_multa === 'pagado')
      .map((inc, i) => {
        const date = new Date(inc.created_at);
        date.setHours(10, 0, 0);
        
        const matchingTurno = turnos.find(t => t.fecha === inc.fecha) || turnos[0];
        
        return {
          chofer_id: inc.chofer_id,
          operadora_id: matchingTurno.operadora_id,
          turno_id: matchingTurno.id,
          concepto: 'Multa',
          monto: inc.monto_multa,
          fecha_hora: date.toISOString(),
          notes: `Pago de multa por incidente (${inc.tipo}): ${inc.descripcion}`
        };
      });

    if (paidIncidentCobros.length > 0) {
      const { error: paidCobErr } = await supabase
        .from('cobros')
        .insert(paidIncidentCobros);
      if (paidCobErr) throw paidCobErr;
      console.log(`✅ ${paidIncidentCobros.length} cobros específicos de multas pagadas insertados en caja.`);
    }

    console.log('🌟 ¡DATOS DE DEMOSTRACIÓN CARGADOS CON ÉXITO! El sistema está vivo y listo para explorar.');
  } catch (err) {
    console.error('❌ Error cargando los datos de prueba:', err.message);
  }
}

// Ejecutar
seed();
