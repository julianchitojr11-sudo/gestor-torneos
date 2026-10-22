const API_URL = '/gestor-torneos/api';
let tabActual = 'torneos';
let cacheTorneos = [];
let cacheEquipos = [];
let cacheJugadores = [];

document.addEventListener('DOMContentLoaded', () => {
  inicializarApp();

  document.getElementById('form-torneo').addEventListener('submit', (e) => guardarEntidad(e, 'torneos'));
  document.getElementById('form-equipo').addEventListener('submit', (e) => guardarEntidad(e, 'equipos'));
  document.getElementById('form-jugador').addEventListener('submit', (e) => guardarEntidad(e, 'jugadores'));
  ['lista-torneos', 'lista-equipos', 'lista-jugadores'].forEach((id) => {
    document.getElementById(id).addEventListener('click', manejarAccionLista);
  });
});

async function inicializarApp() {
  await cargarTodo();
  lucide.createIcons();
}

async function cargarTodo() {
  await Promise.all([cargarTorneos(), cargarEquipos(), cargarJugadores()]);
  actualizarKPIs();
}

// Toast Notificaciones
function mostrarToast(mensaje, tipo = 'exito') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const color = tipo === 'exito' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400';
  
  toast.className = `bg-slate-900 border ${color} px-4 py-3 rounded-xl shadow-xl text-sm flex items-center gap-2 transition duration-300`;
  toast.innerHTML = `<i data-lucide="${tipo === 'exito' ? 'check-circle' : 'alert-circle'}" class="w-4 h-4"></i>`;
  toast.appendChild(document.createTextNode(mensaje));
  
  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function leerRespuesta(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('El servidor devolvió una respuesta no válida.');
  }
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo completar la solicitud.');
  }
  return data;
}

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caracter]);
}

// KPI Counters
function actualizarKPIs() {
  document.getElementById('kpi-torneos').innerText = cacheTorneos.length;
  document.getElementById('kpi-equipos').innerText = cacheEquipos.length;
  document.getElementById('kpi-jugadores').innerText = cacheJugadores.length;
}

// Pestañas
function cambiarTab(tab) {
  tabActual = tab;
  ['torneos', 'equipos', 'jugadores'].forEach(t => {
    document.getElementById(`seccion-${t}`).classList.add('hidden');
    document.getElementById(`btn-tab-${t}`).className = 'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition duration-200 text-slate-400 hover:text-slate-200';
  });

  document.getElementById(`seccion-${tab}`).classList.remove('hidden');
  document.getElementById(`btn-tab-${tab}`).className = 'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition duration-200 bg-amber-500 text-slate-950 font-semibold shadow-md';
  
  const titulosBtn = { torneos: 'Nuevo Torneo', equipos: 'Nuevo Equipo', jugadores: 'Nuevo Jugador' };
  document.getElementById('texto-btn-accion').innerText = titulosBtn[tab];
  document.getElementById('buscador').value = '';
  filtrarContenido();
}

// GET: Torneos
async function cargarTorneos() {
  try {
    const res = await fetch(`${API_URL}/torneos`);
    const data = await leerRespuesta(res);
    if (!Array.isArray(data)) throw new Error('La respuesta de torneos no tiene el formato esperado.');
    cacheTorneos = data;

    const select = document.getElementById('equipo-torneo');
    select.innerHTML = cacheTorneos.length 
      ? cacheTorneos.map(t => `<option value="${escaparHTML(t._id)}">${escaparHTML(t.nombre)} (${escaparHTML(t.categoria)})</option>`).join('')
      : '<option value="">Crea un torneo primero</option>';

    renderTorneos(cacheTorneos);
  } catch (err) {
    console.error('Error al cargar torneos:', err);
    mostrarToast(`No se pudieron cargar los torneos: ${err.message}`, 'error');
  }
}

function renderTorneos(lista) {
  const contenedor = document.getElementById('lista-torneos');
  if (!lista.length) {
    contenedor.innerHTML = `<div class="col-span-full text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl">Sin torneos registrados.</div>`;
    return;
  }

  contenedor.innerHTML = lista.map(t => `
    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-center mb-3">
          <span class="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">${escaparHTML(t.categoria || 'Libre')}</span>
          <span class="text-xs text-slate-500"><i data-lucide="calendar" class="w-3 h-3 inline"></i> ${new Date(t.fechaCreacion).toLocaleDateString()}</span>
        </div>
        <h3 class="text-base font-bold text-slate-100">${escaparHTML(t.nombre)}</h3>
      </div>
      <div class="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-800/60">
        <button data-accion="editar" data-entidad="torneos" data-id="${escaparHTML(t._id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium transition">Editar</button>
        <button data-accion="eliminar" data-entidad="torneos" data-id="${escaparHTML(t._id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition">Eliminar</button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

// GET: Equipos
async function cargarEquipos() {
  try {
    const res = await fetch(`${API_URL}/equipos`);
    const data = await leerRespuesta(res);
    if (!Array.isArray(data)) throw new Error('La respuesta de equipos no tiene el formato esperado.');
    cacheEquipos = data;

    const select = document.getElementById('jugador-equipo');
    select.innerHTML = cacheEquipos.length 
      ? cacheEquipos.map(e => `<option value="${escaparHTML(e._id)}">${escaparHTML(e.nombre)}</option>`).join('')
      : '<option value="">Crea un equipo primero</option>';

    renderEquipos(cacheEquipos);
  } catch (err) {
    console.error('Error al cargar equipos:', err);
    mostrarToast(`No se pudieron cargar los equipos: ${err.message}`, 'error');
  }
}

function renderEquipos(lista) {
  const contenedor = document.getElementById('lista-equipos');
  if (!lista.length) {
    contenedor.innerHTML = `<div class="col-span-full text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl">Sin equipos registrados.</div>`;
    return;
  }

  contenedor.innerHTML = lista.map(e => `
    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition flex flex-col justify-between">
      <div>
        <span class="text-xs font-medium px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">${escaparHTML(e.torneoId ? e.torneoId.nombre : 'Sin Torneo')}</span>
        <h3 class="text-base font-bold text-slate-100 mt-2">${escaparHTML(e.nombre)}</h3>
      </div>
      <div class="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-800/60">
        <button data-accion="editar" data-entidad="equipos" data-id="${escaparHTML(e._id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium transition">Editar</button>
        <button data-accion="eliminar" data-entidad="equipos" data-id="${escaparHTML(e._id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition">Eliminar</button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

// GET: Jugadores
async function cargarJugadores() {
  try {
    const res = await fetch(`${API_URL}/jugadores`);
    const data = await leerRespuesta(res);
    if (!Array.isArray(data)) throw new Error('La respuesta de jugadores no tiene el formato esperado.');
    cacheJugadores = data;

    renderJugadores(cacheJugadores);
  } catch (err) {
    console.error('Error al cargar jugadores:', err);
    mostrarToast(`No se pudieron cargar los jugadores: ${err.message}`, 'error');
  }
}

function renderJugadores(lista) {
  const contenedor = document.getElementById('lista-jugadores');
  if (!lista.length) {
    contenedor.innerHTML = `<div class="col-span-full text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-2xl">Sin jugadores registrados.</div>`;
    return;
  }

  contenedor.innerHTML = lista.map(j => `
    <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Dorsal #${j.numero}</span>
          <span class="text-xs text-slate-400">${escaparHTML(j.equipoId ? j.equipoId.nombre : 'Sin Equipo')}</span>
        </div>
        <h3 class="text-base font-bold text-slate-100">${escaparHTML(j.nombre)}</h3>
      </div>
      <div class="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-800/60">
        <button data-accion="editar" data-entidad="jugadores" data-id="${escaparHTML(j._id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium transition">Editar</button>
        <button data-accion="eliminar" data-entidad="jugadores" data-id="${escaparHTML(j._id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition">Eliminar</button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function manejarAccionLista(event) {
  const boton = event.target.closest('button[data-accion]');
  if (!boton) return;

  const { accion, entidad, id } = boton.dataset;
  if (accion === 'eliminar') {
    eliminarEntidad(entidad, id);
    return;
  }
  if (accion !== 'editar') return;

  if (entidad === 'torneos') {
    const torneo = cacheTorneos.find(item => item._id === id);
    if (torneo) abrirModalDinamico('torneo', id, torneo.nombre, torneo.categoria);
  } else if (entidad === 'equipos') {
    const equipo = cacheEquipos.find(item => item._id === id);
    if (equipo) abrirModalDinamico('equipo', id, equipo.nombre, equipo.torneoId?._id || '');
  } else if (entidad === 'jugadores') {
    const jugador = cacheJugadores.find(item => item._id === id);
    if (jugador) abrirModalDinamico('jugador', id, jugador.nombre, jugador.numero, jugador.equipoId?._id || '');
  }
}

// Buscador Interactivo
function filtrarContenido() {
  const query = document.getElementById('buscador').value.toLowerCase();
  
  if (tabActual === 'torneos') {
    renderTorneos(cacheTorneos.filter(t => t.nombre.toLowerCase().includes(query)));
  } else if (tabActual === 'equipos') {
    renderEquipos(cacheEquipos.filter(e => e.nombre.toLowerCase().includes(query)));
  } else if (tabActual === 'jugadores') {
    renderJugadores(cacheJugadores.filter(j => j.nombre.toLowerCase().includes(query)));
  }
}

// Abrir Modales
function abrirModalDinamico(tipo = '', id = '', campo1 = '', campo2 = '', campo3 = '') {
  const tiposFormulario = {
    torneos: 'torneo',
    equipos: 'equipo',
    jugadores: 'jugador'
  };
  const tipoActual = (tipo || tabActual).toLowerCase();
  const t = tiposFormulario[tipoActual] || tipoActual;

  // Ocultar todos los formularios antes de mostrar el correspondiente
  ['torneo', 'equipo', 'jugador'].forEach(m => {
    const form = document.getElementById(`form-${m}`);
    if (form) form.classList.add('hidden');
  });

  const modal = document.getElementById('modal-dinamico');
  const titulo = document.getElementById('modal-titulo');

  if (t === 'torneo') {
    titulo.innerHTML = `<i data-lucide="award" class="w-5 h-5 text-amber-400"></i> ${id ? 'Editar Torneo' : 'Nuevo Torneo'}`;
    document.getElementById('torneo-id').value = id;
    document.getElementById('torneo-nombre').value = campo1;
    document.getElementById('torneo-categoria').value = campo2 || 'Libre';
    document.getElementById('form-torneo').classList.remove('hidden');
  } else if (t === 'equipo') {
    titulo.innerHTML = `<i data-lucide="shield" class="w-5 h-5 text-teal-400"></i> ${id ? 'Editar Equipo' : 'Nuevo Equipo'}`;
    document.getElementById('equipo-id').value = id;
    document.getElementById('equipo-nombre').value = campo1;
    if (campo2 && document.getElementById('equipo-torneo')) {
      document.getElementById('equipo-torneo').value = campo2;
    }
    document.getElementById('form-equipo').classList.remove('hidden');
  } else if (t === 'jugador') {
    titulo.innerHTML = `<i data-lucide="users" class="w-5 h-5 text-indigo-400"></i> ${id ? 'Editar Jugador' : 'Nuevo Jugador'}`;
    document.getElementById('jugador-id').value = id;
    document.getElementById('jugador-nombre').value = campo1;
    document.getElementById('jugador-numero').value = campo2;
    if (campo3 && document.getElementById('jugador-equipo')) {
      document.getElementById('jugador-equipo').value = campo3;
    }
    document.getElementById('form-jugador').classList.remove('hidden');
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function cerrarModal() {
  document.getElementById('modal-dinamico').classList.add('hidden');
}

// POST / PUT Dinámico
async function guardarEntidad(e, entidad) {
  e.preventDefault();
  let payload = {};
  let id = '';

  if (entidad === 'torneos') {
    id = document.getElementById('torneo-id').value;
    payload = {
      nombre: document.getElementById('torneo-nombre').value,
      categoria: document.getElementById('torneo-categoria').value
    };
  } else if (entidad === 'equipos') {
    id = document.getElementById('equipo-id').value;
    payload = {
      nombre: document.getElementById('equipo-nombre').value,
      torneoId: document.getElementById('equipo-torneo').value
    };
  } else if (entidad === 'jugadores') {
    id = document.getElementById('jugador-id').value;
    payload = {
      nombre: document.getElementById('jugador-nombre').value,
      numero: document.getElementById('jugador-numero').value,
      equipoId: document.getElementById('jugador-equipo').value
    };
  } else {
    mostrarToast('Tipo de registro no válido.', 'error');
    return;
  }

  const url = id ? `${API_URL}/${entidad}/${id}` : `${API_URL}/${entidad}`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await leerRespuesta(res);
    cerrarModal();
    await cargarTodo();
    mostrarToast(`Registro ${id ? 'actualizado' : 'creado'} con éxito`);
  } catch (err) {
    console.error('Error al guardar el registro:', err);
    mostrarToast(err.message || 'Error de conexión', 'error');
  }
}

// DELETE Dinámico
async function eliminarEntidad(entidad, id) {
  if (!confirm('¿Deseas eliminar este registro de la base de datos?')) return;

  try {
    const res = await fetch(`${API_URL}/${entidad}/${id}`, { method: 'DELETE' });
    await leerRespuesta(res);
    await cargarTodo();
    mostrarToast('Registro eliminado');
  } catch (err) {
    console.error('Error al eliminar el registro:', err);
    mostrarToast(err.message || 'Error de conexión', 'error');
  }
}