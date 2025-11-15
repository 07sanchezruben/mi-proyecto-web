const API_BASE = '/api/v1';
const state = {
  token: null,
  user: null,
  socket: null,
  proposals: [],
  designs: []
};

const views = document.querySelectorAll('.view');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

function showView(id) {
  views.forEach((view) => view.classList.toggle('active', view.id === id));
}

function activateSidebar(containerId, tabId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const buttons = container.querySelectorAll('.sidebar-item');
  const tabs = container.querySelectorAll('.tab');
  buttons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tabId));
  tabs.forEach((tab) => tab.classList.toggle('active', tab.id === tabId));
}

function handleNavigation() {
  document.body.addEventListener('click', (event) => {
    const navTarget = event.target.closest('[data-nav]');
    if (navTarget) {
      event.preventDefault();
      const viewId = navTarget.dataset.nav;
      if (viewId === 'matching' && state.user?.role === 'company') {
        showView('company-dashboard');
        activateSidebar('company-dashboard', 'company-matches');
      } else {
        showView(viewId);
      }
    }
    const openTarget = event.target.closest('[data-open]');
    if (openTarget) {
      event.preventDefault();
      showView(openTarget.dataset.open);
      if (openTarget.dataset.role) {
        const usernameInput = document.querySelector('#login-form [name="username"]');
        if (usernameInput) usernameInput.value = openTarget.dataset.role + '_demo';
      }
    }
    const sidebarItem = event.target.closest('.sidebar-item');
    if (sidebarItem) {
      const parentSection = sidebarItem.closest('.dashboard');
      if (parentSection) {
        const tabsContainer = parentSection.parentElement;
        const tabId = sidebarItem.dataset.tab;
        activateSidebar(parentSection.parentElement.id, tabId);
      }
    }
  });
}

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error en la operación');
  }
  if (response.status === 204) return null;
  return response.json();
}

function connectSocket() {
  if (state.socket) state.socket.disconnect();
  if (!state.token) return;
  state.socket = io('/', { auth: { token: state.token } });
  state.socket.on('connect', () => console.log('Socket conectado'));
  state.socket.on('proposal:update', () => refreshData());
  state.socket.on('message:new', (payload) => {
    showToast(`Nuevo mensaje en propuesta ${payload.proposalId}`);
  });
  state.socket.on('workshop:slot', () => refreshData());
  state.socket.on('payment:update', (payload) => {
    showToast(`Estado de pago actualizado: ${payload.status}`);
    refreshData();
  });
}

function showToast(text) {
  const toast = document.createElement('div');
  toast.className = 'toast card';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function login(username, password) {
  const { token, user } = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  state.token = token;
  state.user = user;
  localStorage.setItem('publicarToken', token);
  localStorage.setItem('publicarUser', JSON.stringify(user));
  document.getElementById('user-info')?.classList.remove('hidden');
  document.getElementById('user-role').textContent = user.role;
  connectSocket();
  await refreshData();
  redirectByRole(user.role);
}

function redirectByRole(role) {
  switch (role) {
    case 'driver':
      showView('driver-dashboard');
      activateSidebar('driver-dashboard', 'driver-home');
      break;
    case 'company':
      showView('company-dashboard');
      activateSidebar('company-dashboard', 'company-matches');
      break;
    case 'workshop':
      showView('workshop-dashboard');
      activateSidebar('workshop-dashboard', 'workshop-slots');
      break;
    case 'admin':
      showView('admin-dashboard');
      activateSidebar('admin-dashboard', 'admin-summary');
      break;
    default:
      showView('home');
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('publicarToken');
  localStorage.removeItem('publicarUser');
  document.getElementById('user-info')?.classList.add('hidden');
  if (state.socket) state.socket.disconnect();
  showView('home');
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
  logout();
});

async function handleRegisterForms() {
  document.querySelectorAll('.register-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const role = form.dataset.role;
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      try {
        if (role === 'driver') {
          const profile = {
            name: payload.name,
            residenceCity: payload.residenceCity,
            contactPhone: payload.contactPhone,
            dni: payload.dni,
            circulationCity: payload.circulationCity,
            circulationZones: payload.circulationZones.split(',').map((z) => z.trim()).filter(Boolean),
            kmPerMonthRange: payload.kmPerMonthRange,
            kmPerMonth: Number(payload.kmPerMonth),
            vehicleModel: payload.vehicleModel,
            wrapSize: payload.wrapSize,
            categories: payload.categories.split(',').map((c) => c.trim()).filter(Boolean),
            drivingSlot: payload.drivingSlot,
            paymentMethod: payload.paymentMethod,
            paymentDetails: { raw: payload.paymentDetails }
          };
          await apiFetch('/auth/register/driver', {
            method: 'POST',
            body: JSON.stringify({
              username: payload.username,
              password: payload.password,
              email: payload.email,
              profile
            })
          });
        } else if (role === 'company') {
          const profile = {
            brand: payload.brand,
            companyName: payload.companyName,
            nif: payload.nif,
            address: payload.address,
            city: payload.city,
            contactPhone: payload.contactPhone,
            circulationCity: payload.circulationCity,
            targetZones: payload.targetZones.split(',').map((z) => z.trim()).filter(Boolean),
            desiredKmRange: payload.desiredKmRange,
            minKmPerMonth: Number(payload.minKmPerMonth),
            wrapSize: payload.wrapSize,
            categories: payload.categories.split(',').map((c) => c.trim()).filter(Boolean),
            targetSlot: payload.targetSlot,
            budgetPerMonth: Number(payload.budgetPerMonth),
            campaignDurationMonths: Number(payload.campaignDurationMonths)
          };
          await apiFetch('/auth/register/company', {
            method: 'POST',
            body: JSON.stringify({ username: payload.username, password: payload.password, email: payload.email, profile })
          });
        } else if (role === 'workshop') {
          const profile = {
            name: payload.name,
            location: payload.location,
            scheduleDescription: payload.scheduleDescription,
            contactPhone: payload.contactPhone
          };
          await apiFetch('/auth/register/workshop', {
            method: 'POST',
            body: JSON.stringify({ username: payload.username, password: payload.password, email: payload.email, profile })
          });
        }
        form.reset();
        showToast('Registro completado. Revisa tu email para validar la cuenta.');
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

async function refreshData() {
  if (!state.user) return;
  try {
    if (state.user.role === 'driver') {
      const [{ profile }, { proposals }] = await Promise.all([
        apiFetch('/drivers/me'),
        apiFetch('/drivers/me/proposals')
      ]);
      renderDriverProfile(profile);
      renderDriverProposals(proposals);
      renderDriverWrapOptions(proposals);
    }
    if (state.user.role === 'company') {
      const [{ profile }, { matches }, { designs }] = await Promise.all([
        apiFetch('/companies/me'),
        apiFetch('/companies/me/matches'),
        apiFetch('/vinyl-designs')
      ]);
      state.designs = designs;
      renderCompanyProfile(profile);
      renderCompanyMatches(matches, designs);
      renderDesigns(designs);
    }
    if (state.user.role === 'workshop') {
      const workshops = await apiFetch(`/workshops/${state.user.id}/slots`);
      renderWorkshopSlots(workshops.slots);
    }
    if (state.user.role === 'admin') {
      const [{ summary }, payments, events, users] = await Promise.all([
        apiFetch('/admin/summary'),
        apiFetch('/admin/payments'),
        apiFetch('/admin/events'),
        apiFetch('/admin/users')
      ]);
      renderAdminSummary(summary);
      renderAdminPayments(payments);
      renderAdminEvents(events);
      renderAdminUsers(users);
    }
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

function renderDriverProfile(profile) {
  const form = document.getElementById('driver-profile-form');
  if (!form) return;
  form.innerHTML = '';
  const fields = [
    ['name', 'Nombre', profile.name],
    ['residenceCity', 'Ciudad de residencia', profile.residenceCity],
    ['contactPhone', 'Teléfono', profile.contactPhone],
    ['dni', 'DNI', profile.dni],
    ['circulationCity', 'Ciudad de circulación', profile.circulationCity],
    ['circulationZones', 'Zonas', (profile.circulationZones || []).join(', ')],
    ['kmPerMonthRange', 'Rango km/mes', profile.kmPerMonthRange],
    ['kmPerMonth', 'Km al mes', profile.kmPerMonth],
    ['vehicleModel', 'Modelo', profile.vehicleModel],
    ['wrapSize', 'Tamaño vinilo', profile.wrapSize],
    ['categories', 'Temáticas', (profile.categories || []).join(', ')],
    ['drivingSlot', 'Franja', profile.drivingSlot],
    ['paymentMethod', 'Método cobro', profile.paymentMethod],
    ['paymentDetails', 'Detalles', JSON.stringify(profile.paymentDetails || {})]
  ];
  fields.forEach(([key, label, value]) => {
    const input = document.createElement(key === 'paymentDetails' ? 'textarea' : 'input');
    input.name = key;
    input.value = value ?? '';
    if (key === 'kmPerMonth') input.type = 'number';
    const wrapper = document.createElement('label');
    wrapper.textContent = label;
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });
  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn';
  saveBtn.textContent = 'Guardar cambios';
  form.appendChild(saveBtn);
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.circulationZones = data.circulationZones.split(',').map((z) => z.trim()).filter(Boolean);
    data.categories = data.categories.split(',').map((z) => z.trim()).filter(Boolean);
    data.kmPerMonth = Number(data.kmPerMonth);
    try {
      await apiFetch('/drivers/me', { method: 'PUT', body: JSON.stringify(data) });
      showToast('Perfil actualizado');
      refreshData();
    } catch (error) {
      showToast(error.message);
    }
  };
}

function renderDriverProposals(proposals) {
  state.proposals = proposals;
  const list = document.getElementById('driver-proposals-list');
  if (!list) return;
  list.innerHTML = '';
  proposals.forEach((proposal) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${proposal.company.brand}</h3>
      <p>${proposal.company.circulationCity} · ${proposal.company.targetZones.join(', ')}</p>
      <p><span class="badge">Match ${proposal.matchScore}%</span></p>
      <p>Ganancia estimada conductor: <strong>${proposal.estEarning} € / mes</strong></p>
      <p>Estado: ${proposal.status}</p>
      ${proposal.selectedVinyl ? `<img src="${proposal.selectedVinyl.fileUrl}" alt="Diseño" class="vinyl-preview" />` : '<p>La empresa aún no ha seleccionado un diseño.</p>'}
      <div class="actions"></div>
    `;
    const actions = card.querySelector('.actions');
    if (proposal.status === 'pending_driver') {
      const acceptBtn = document.createElement('button');
      acceptBtn.className = 'btn';
      acceptBtn.textContent = 'Aceptar';
      acceptBtn.onclick = () => updateProposal(proposal.id, 'accept');
      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'btn ghost';
      rejectBtn.textContent = 'Rechazar';
      rejectBtn.onclick = () => updateProposal(proposal.id, 'reject');
      actions.append(acceptBtn, rejectBtn);
    }
    list.appendChild(card);
  });
}

async function updateProposal(id, action) {
  try {
    await apiFetch(`/proposals/${id}/${action}`, { method: 'PATCH' });
    showToast('Propuesta actualizada');
    refreshData();
  } catch (error) {
    showToast(error.message);
  }
}

function renderDriverWrapOptions(proposals) {
  const list = document.getElementById('driver-wrap-list');
  const detail = document.getElementById('driver-wrap-detail');
  if (!list || !detail) return;
  list.innerHTML = '';
  const accepted = proposals.filter((p) => p.status === 'accepted');
  if (!accepted.length) {
    detail.classList.add('hidden');
    list.innerHTML = '<p class="notice">Acepta una propuesta para poder agendar el vinilado.</p>';
    return;
  }
  accepted.forEach((proposal) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${proposal.company.brand}</h3>
      <p>Match ${proposal.matchScore}% · Ganancia ${proposal.estEarning} €</p>
      <button class="btn">Agendar vinilado con esta empresa</button>
    `;
    card.querySelector('button').onclick = () => openWrapDetail(proposal);
    list.appendChild(card);
  });
}

async function openWrapDetail(proposal) {
  const detail = document.getElementById('driver-wrap-detail');
  detail.classList.remove('hidden');
  const { workshops } = await apiFetch('/workshops');
  detail.innerHTML = `
    <h3>${proposal.company.brand}</h3>
    <p>El vinilado no lo pagarás tú; solo tendrás que acudir al taller elegido.</p>
    ${proposal.selectedVinyl ? `<img src="${proposal.selectedVinyl.fileUrl}" class="vinyl-preview" />` : ''}
    <div class="list-grid" id="workshop-select"></div>
  `;
  const container = detail.querySelector('#workshop-select');
  workshops.forEach((workshop) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h4>${workshop.name}</h4>
      <p>${workshop.location}</p>
      <p>${workshop.scheduleDescription}</p>
      <button class="btn ghost">Ver horarios</button>
      <div class="slots hidden"></div>
    `;
    const slotsContainer = card.querySelector('.slots');
    card.querySelector('button').onclick = async () => {
      const { slots } = await apiFetch(`/workshops/${workshop.id}/slots`);
      slotsContainer.innerHTML = '';
      slots.forEach((slot) => {
        const slotEl = document.createElement('div');
        slotEl.className = `slot ${slot.taken ? 'taken' : 'free'}`;
        slotEl.textContent = new Date(slot.time).toLocaleString();
        if (!slot.taken) {
          slotEl.onclick = () => selectSlot(proposal.id, workshop.id, slot.id);
        }
        slotsContainer.appendChild(slotEl);
      });
      slotsContainer.classList.remove('hidden');
    };
    container.appendChild(card);
  });
}

async function selectSlot(proposalId, workshopId, slotId) {
  try {
    await apiFetch(`/proposals/${proposalId}/select-workshop`, {
      method: 'PATCH',
      body: JSON.stringify({ workshopId, slotId })
    });
    showToast('Cita confirmada');
    refreshData();
  } catch (error) {
    showToast(error.message);
  }
}

function renderCompanyProfile(profile) {
  const form = document.getElementById('company-profile-form');
  if (!form) return;
  form.innerHTML = '';
  const fields = Object.entries({
    brand: profile.brand,
    companyName: profile.companyName,
    nif: profile.nif,
    address: profile.address,
    city: profile.city,
    contactPhone: profile.contactPhone,
    circulationCity: profile.circulationCity,
    targetZones: (profile.targetZones || []).join(', '),
    desiredKmRange: profile.desiredKmRange,
    minKmPerMonth: profile.minKmPerMonth,
    wrapSize: profile.wrapSize,
    categories: (profile.categories || []).join(', '),
    targetSlot: profile.targetSlot,
    budgetPerMonth: profile.budgetPerMonth,
    campaignDurationMonths: profile.campaignDurationMonths
  });
  fields.forEach(([key, value]) => {
    const input = document.createElement('input');
    input.name = key;
    input.value = value ?? '';
    if (key.includes('Km') || key.includes('budget') || key.includes('Duration')) input.type = 'number';
    const wrapper = document.createElement('label');
    wrapper.textContent = key;
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });
  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn';
  saveBtn.textContent = 'Guardar cambios';
  form.appendChild(saveBtn);
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.targetZones = data.targetZones.split(',').map((z) => z.trim()).filter(Boolean);
    data.categories = data.categories.split(',').map((z) => z.trim()).filter(Boolean);
    data.minKmPerMonth = Number(data.minKmPerMonth);
    data.budgetPerMonth = Number(data.budgetPerMonth);
    data.campaignDurationMonths = Number(data.campaignDurationMonths);
    try {
      await apiFetch('/companies/me', { method: 'PUT', body: JSON.stringify(data) });
      showToast('Perfil actualizado');
      refreshData();
    } catch (error) {
      showToast(error.message);
    }
  };
}

function renderCompanyMatches(matches, designs) {
  const list = document.getElementById('company-matches-list');
  if (!list) return;
  list.innerHTML = '';
  matches.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.driver.name}</h3>
      <p>${item.driver.circulationCity} · ${item.driver.vehicleModel}</p>
      <p>Kilómetros/mes: ${item.driver.kmPerMonth}</p>
      <p>Tamaño vinilo: ${item.driver.wrapSize}</p>
      <p><span class="badge">Match ${item.matchScore}%</span></p>
      <p>Coste estimado: ${item.grossMonthly} € / mes</p>
      <label>Diseño
        <select data-driver="${item.driver.id}">
          <option value="">Selecciona diseño</option>
          ${designs.map((d) => `<option value="${d.id}">${d.name}</option>`).join('')}
        </select>
      </label>
      <button class="btn" data-action="proposal" data-driver="${item.driver.id}">Crear propuesta</button>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll('[data-action="proposal"]').forEach((btn) => {
    btn.onclick = async () => {
      const driverId = Number(btn.dataset.driver);
      const select = list.querySelector(`select[data-driver="${driverId}"]`);
      try {
        await apiFetch('/companies/me/proposals', {
          method: 'POST',
          body: JSON.stringify({ driverId, selectedVinylId: Number(select.value) || null })
        });
        showToast('Propuesta enviada al conductor');
        refreshData();
      } catch (error) {
        showToast(error.message);
      }
    };
  });
}

function renderDesigns(designs) {
  const gallery = document.getElementById('designs-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';
  designs.forEach((design) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${design.fileUrl}" alt="${design.name}" class="vinyl-preview" />
      <h4>${design.name}</h4>
      <button class="btn ghost" data-delete="${design.id}">Eliminar</button>
    `;
    gallery.appendChild(card);
  });
  gallery.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.onclick = async () => {
      try {
        await apiFetch(`/vinyl-designs/${btn.dataset.delete}`, { method: 'DELETE' });
        showToast('Diseño eliminado');
        refreshData();
      } catch (error) {
        showToast(error.message);
      }
    };
  });
}

document.getElementById('design-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    await apiFetch('/vinyl-designs', { method: 'POST', body: JSON.stringify(data) });
    form.reset();
    showToast('Diseño subido correctamente');
    refreshData();
  } catch (error) {
    showToast(error.message);
  }
});

async function renderWorkshopSlots(slots) {
  const list = document.getElementById('workshop-slots-list');
  if (!list) return;
  list.innerHTML = '';
  slots.forEach((slot) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h4>${new Date(slot.time).toLocaleString()}</h4>
      <p>${slot.taken ? 'Ocupado' : 'Disponible'}</p>
    `;
    list.appendChild(card);
  });
}

document.getElementById('workshop-slot-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  try {
    await apiFetch(`/workshops/${state.user.id}/slots`, {
      method: 'POST',
      body: JSON.stringify({ time: data.time })
    });
    event.target.reset();
    refreshData();
  } catch (error) {
    showToast(error.message);
  }
});

function renderAdminSummary(summary) {
  const container = document.getElementById('admin-summary-content');
  if (!container) return;
  container.innerHTML = `
    <div class="card">Total procesado: ${summary.processedTotal.toFixed(2)} €</div>
    <div class="card">Comisión PubliCar: ${summary.platformFee.toFixed(2)} €</div>
    <div class="card">Pagado a conductores: ${summary.driverNet.toFixed(2)} €</div>
    <div class="card">Usuarios por rol: ${summary.usersByRole.map((u) => `${u.role}: ${u._count.role}`).join(' · ')}</div>
    <div class="card">Propuestas: ${summary.proposalsByStatus.map((p) => `${p.status}: ${p._count.status}`).join(' · ')}</div>
    <div class="card">Pagos: ${summary.paymentsByStatus.map((p) => `${p.status}: ${p._count.status}`).join(' · ')}</div>
  `;
}

function renderAdminPayments({ payments }) {
  const table = document.getElementById('admin-payments-table');
  if (!table) return;
  table.innerHTML = '<tr><th>Empresa</th><th>Conductor</th><th>Importe</th><th>Comisión</th><th>Neto conductor</th><th>Estado</th></tr>';
  payments.forEach((payment) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${payment.company.user.email}</td>
      <td>${payment.driver.user.email}</td>
      <td>${payment.amountGross} €</td>
      <td>${payment.platformFee} €</td>
      <td>${payment.driverNet} €</td>
      <td>${payment.status}</td>
    `;
    table.appendChild(row);
  });
}

function renderAdminEvents({ events }) {
  const list = document.getElementById('admin-events-list');
  if (!list) return;
  list.innerHTML = '';
  events.forEach((event) => {
    const li = document.createElement('li');
    li.textContent = `${new Date(event.createdAt).toLocaleString()} · ${event.type}`;
    list.appendChild(li);
  });
}

function renderAdminUsers({ users }) {
  const table = document.getElementById('admin-users-table');
  if (!table) return;
  table.innerHTML = '<tr><th>Usuario</th><th>Rol</th><th>Email</th><th>Activo</th><th>Acciones</th></tr>';
  users.forEach((user) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td>${user.email}</td>
      <td>${user.active ? 'Sí' : 'No'}</td>
      <td><button class="btn ghost" data-toggle="${user.id}">${user.active ? 'Desactivar' : 'Activar'}</button></td>
    `;
    table.appendChild(row);
  });
  table.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.onclick = async () => {
      try {
        await apiFetch(`/admin/users/${btn.dataset.toggle}`, {
          method: 'PATCH',
          body: JSON.stringify({ active: btn.textContent === 'Activar' })
        });
        refreshData();
      } catch (error) {
        showToast(error.message);
      }
    };
  });
}

document.getElementById('login-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  try {
    await login(data.username, data.password);
  } catch (error) {
    showToast(error.message);
  }
});

handleRegisterForms();
handleNavigation();

const storedToken = localStorage.getItem('publicarToken');
const storedUser = localStorage.getItem('publicarUser');
if (storedToken && storedUser) {
  state.token = storedToken;
  state.user = JSON.parse(storedUser);
  document.getElementById('user-info')?.classList.remove('hidden');
  document.getElementById('user-role').textContent = state.user.role;
  connectSocket();
  refreshData();
  redirectByRole(state.user.role);
} else {
  showView('home');
}
