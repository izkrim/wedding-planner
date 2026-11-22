// frontend/js/dashboard.js
import { api } from './api.js';

let currentWedding = null;

// ==========================================
// ===== FUNGSI NAVIGASI TAB =====
// ==========================================
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  const activeBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  // Hapus garis snake lama agar tidak nyangkut ke tab lain
  const oldSvg = document.querySelector('.timeline-svg');
  if (oldSvg) oldSvg.remove();

  // Jika tab timeline dibuka, gambar ulang garisnya
  if (tabId === 'tab-timeline' && currentWedding) {
    setTimeout(drawSnakePath, 150);
  }
};

// ==========================================
// ===== INISIALISASI DASHBOARD =====
// ==========================================
export async function initDashboard() {
  try {
    const wedding = await api('/wedding/mine');
    document.getElementById('loading').style.display = 'none';
    
    if (!wedding) {
      document.getElementById('no-wedding').style.display = 'block';
    } else {
      currentWedding = wedding;
      document.getElementById('wedding-content').style.display = 'block';
      document.getElementById('couple-title').textContent = wedding.coupleName;
      document.getElementById('invite-code-display').textContent = wedding.inviteCode;
      
      loadTimeline();
      loadChecklist();
      loadBudget();
      loadGuests();
      loadVenues();
      loadVendors();
    }
  } catch (err) {
    document.getElementById('loading').innerHTML = `<p style="color:red; text-align:center;">Gagal memuat: ${err.message}</p>`;
  }
}

// ==========================================
// ===== FITUR TIMELINE =====
// ==========================================
async function loadTimeline() {
  const tasks = await api(`/tasks?weddingId=${currentWedding._id}`);
  const container = document.getElementById('timeline-nodes');
  container.innerHTML = '';

  if (tasks.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#8a827a; padding: 2rem;">Belum ada agenda.</p>';
    return;
  }

  tasks.forEach((task, index) => {
    const pos = index % 2 === 0 ? 'left' : 'right';
    const div = document.createElement('div');
    div.className = `tl-node ${pos}`;
    
    const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanpa Tanggal';
    const iconName = (task.icon && !task.icon.startsWith('fa-')) ? task.icon : 'ring';

    div.innerHTML = `
      <div class="tl-card">
        <div class="tl-icon"><i data-lucide="${iconName}"></i></div>
        <div class="tl-title">${task.title}</div>
        <div class="tl-date">${dateStr}</div>
        <div style="margin-top: 10px; text-align: center;">
          <button onclick="deleteTask('${task._id}')" style="background: #fee2e2; color: #991b1b; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">Hapus</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  if (window.lucide) window.lucide.createIcons();
  setTimeout(() => drawSnakePath(), 100);
}

window.addTask = async function(e) {
  e.preventDefault();
  const title = document.getElementById('task-title').value;
  const dueDate = document.getElementById('task-date').value;
  const icon = document.getElementById('task-icon').value;
  
  const data = { title, dueDate, icon, weddingId: currentWedding._id };
  const btn = e.target.querySelector('button');

  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  try {
    await api('/tasks', 'POST', data);
    e.target.reset();
    await loadTimeline(); 
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    btn.textContent = 'Tambah';
    btn.disabled = false;
  }
};

window.deleteTask = async function(id) {
  if(confirm('Hapus agenda ini?')) {
    await api(`/tasks/${id}`, 'DELETE');
    await loadTimeline();
  }
};

function drawSnakePath() {
  const timeline = document.getElementById('timeline-nodes');
  if (!timeline) return;

  const oldSvg = document.querySelector('.timeline-svg');
  if (oldSvg) oldSvg.remove();

  const nodes = timeline.querySelectorAll('.tl-card');
  if (nodes.length < 2) return;

  const tlRect = timeline.getBoundingClientRect();
  const points = Array.from(nodes).map(n => {
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2 - tlRect.left, y: r.top + r.height / 2 - tlRect.top };
  });

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'timeline-svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${tlRect.width} ${timeline.scrollHeight}`);

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], cur = points[i];
    const midY = (prev.y + cur.y) / 2;
    d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
  }

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', '#A55A3E');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-dasharray', '6,4');
  svg.appendChild(path);
  
  timeline.prepend(svg);
}

// ==========================================
// ===== FITUR CHECKLIST (TAMBAH, EDIT, HAPUS) =====
// ==========================================
async function loadChecklist() {
  const items = await api(`/checklist?weddingId=${currentWedding._id}`);
  const list = document.getElementById('checklist-list');
  
  if (items.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#8a827a; padding: 1rem;">Belum ada daftar tugas.</p>';
    document.getElementById('checklist-progress-bar').style.width = '0%';
    document.getElementById('checklist-progress-text').textContent = '0% (0/0)';
    return;
  }

  // Hitung Progres
  const completed = items.filter(i => i.isCompleted).length;
  const percent = Math.round((completed / items.length) * 100);
  document.getElementById('checklist-progress-bar').style.width = `${percent}%`;
  document.getElementById('checklist-progress-text').textContent = `${percent}% (${completed}/${items.length})`;

  list.innerHTML = items.map(item => `
    <li style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; ${item.isCompleted ? 'opacity: 0.6;' : ''}">
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" 
          ${item.isCompleted ? 'checked' : ''} 
          onchange="toggleChecklist('${item._id}', this.checked)"
          style="width: 20px; height: 20px; cursor: pointer; accent-color: #ec4899;">
        
        <div style="font-weight: bold; color: #2b2b2b; font-size: 1.05rem; ${item.isCompleted ? 'text-decoration: line-through;' : ''}">
          ${item.task}
        </div>
      </div>
      
      <div style="display: flex; gap: 8px;">
        <button class="btn-action btn-edit" onclick="editChecklist('${item._id}', '${item.task.replace(/'/g, "\\'")}')" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-action btn-delete" onclick="deleteChecklist('${item._id}')" title="Hapus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </li>
  `).join('');
}

window.addChecklist = async function(e) {
  e.preventDefault();
  const id = document.getElementById('checklist-id').value;
  const task = document.getElementById('checklist-task').value;
  
  let data = { task };
  if (!id) data.weddingId = currentWedding._id; // Hanya kirim weddingId jika tambah baru

  const btn = document.getElementById('btn-submit-checklist');
  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  try {
    if (id) {
      await api(`/checklist/${id}`, 'PUT', data); // Mode Edit
    } else {
      await api('/checklist', 'POST', data); // Mode Tambah
    }
    window.cancelEditChecklist();
    await loadChecklist();
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    btn.textContent = id ? 'Simpan Perubahan' : 'Tambah Tugas';
    btn.disabled = false;
  }
};

window.editChecklist = function(id, task) {
  document.getElementById('checklist-id').value = id;
  document.getElementById('checklist-task').value = task;
  
  document.getElementById('btn-submit-checklist').textContent = 'Simpan Perubahan';
  document.getElementById('btn-cancel-checklist').style.display = 'inline-block';
  document.getElementById('checklist-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEditChecklist = function() {
  document.getElementById('checklist-id').value = '';
  document.getElementById('checklist-form').reset();
  document.getElementById('btn-submit-checklist').textContent = 'Tambah Tugas';
  document.getElementById('btn-cancel-checklist').style.display = 'none';
};

window.toggleChecklist = async function(id, isCompleted) {
  await api(`/checklist/${id}`, 'PUT', { isCompleted });
  loadChecklist();
};

window.deleteChecklist = async function(id) {
  if(confirm('Hapus tugas ini?')) {
    await api(`/checklist/${id}`, 'DELETE');
    loadChecklist();
  }
};

// ==========================================
// ===== FITUR BUDGET =====
// ==========================================
async function loadBudget() {
  const items = await api(`/budget?weddingId=${currentWedding._id}`);
  const list = document.getElementById('budget-list');
  
  let totalEst = 0;
  let totalAct = 0;
  items.forEach(item => {
    totalEst += item.estimatedCost;
    totalAct += (item.actualCost || 0);
  });

  const estEl = document.getElementById('total-estimated');
  const actEl = document.getElementById('total-actual');
  const remEl = document.getElementById('total-remaining');
  
  if (estEl && actEl && remEl) {
    estEl.textContent = `Rp ${totalEst.toLocaleString('id-ID')}`;
    actEl.textContent = `Rp ${totalAct.toLocaleString('id-ID')}`;
    const remaining = totalEst - totalAct;
    remEl.textContent = `Rp ${remaining.toLocaleString('id-ID')}`;
    remEl.style.color = remaining < 0 ? '#ef4444' : '#A55A3E';
  }

  if (items.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#8a827a; padding: 1rem;">Belum ada catatan budget.</p>';
    return;
  }

  list.innerHTML = items.map(item => `
    <li style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; flex-wrap: wrap; gap: 10px;">
      <div style="flex: 1; min-width: 150px;">
        <div style="font-weight: bold; color: #2b2b2b; font-size: 1.1rem;">${item.item}</div>
        <div style="font-size: 0.85rem; color: #8a827a; margin-top: 4px;">
          Rencana: Rp ${item.estimatedCost.toLocaleString('id-ID')} <br>
          Terpakai: <span style="color: #ef4444; font-weight: bold;">Rp ${(item.actualCost || 0).toLocaleString('id-ID')}</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="btn-action btn-edit" onclick="editBudget('${item._id}', '${item.item.replace(/'/g, "\\'")}', ${item.estimatedCost}, ${item.actualCost || 0})" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-action btn-delete" onclick="deleteBudget('${item._id}')" title="Hapus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </li>
  `).join('');
}

window.addBudget = async function(e) {
  e.preventDefault();
  const id = document.getElementById('budget-id').value;
  const item = document.getElementById('budget-item').value;
  const estimatedCost = Number(document.getElementById('budget-estimated').value);
  const actualCost = Number(document.getElementById('budget-actual').value) || 0;
  
  let data = { item, estimatedCost, actualCost };
  if (!id) data.weddingId = currentWedding._id;

  try {
    if (id) {
      await api(`/budget/${id}`, 'PUT', data);
    } else {
      await api('/budget', 'POST', data);
    }
    window.cancelEditBudget();
    await loadBudget();
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  }
};

window.editBudget = function(id, item, estimatedCost, actualCost) {
  document.getElementById('budget-id').value = id;
  document.getElementById('budget-item').value = item;
  document.getElementById('budget-estimated').value = estimatedCost;
  document.getElementById('budget-actual').value = actualCost;
  document.getElementById('btn-submit-budget').textContent = 'Simpan Perubahan';
  document.getElementById('btn-cancel-budget').style.display = 'inline-block';
  document.getElementById('budget-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEditBudget = function() {
  document.getElementById('budget-id').value = '';
  document.getElementById('budget-form').reset();
  document.getElementById('btn-submit-budget').textContent = 'Tambah';
  document.getElementById('btn-cancel-budget').style.display = 'none';
};

window.deleteBudget = async function(id) {
  if(confirm('Hapus budget ini?')) {
    await api(`/budget/${id}`, 'DELETE');
    await loadBudget();
  }
};

// ==========================================
// ===== FITUR GUESTS =====
// ==========================================
async function loadGuests() {
  const guests = await api(`/guests?weddingId=${currentWedding._id}`);
  const list = document.getElementById('guest-list');
  
  const totalPax = guests.reduce((sum, g) => sum + (g.pax || 1), 0);
  const attendingPax = guests.filter(g => g.rsvp === 'Attending').reduce((sum, g) => sum + (g.pax || 1), 0);

  const totalEl = document.getElementById('total-guests');
  const attEl = document.getElementById('total-attending');
  if (totalEl && attEl) {
    totalEl.textContent = totalPax;
    attEl.textContent = attendingPax;
  }

  if (guests.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#8a827a; padding: 1rem;">Belum ada tamu undangan.</p>';
    return;
  }

  list.innerHTML = guests.map(guest => {
    let badgeColor = '#fef3c7'; let textColor = '#92400e'; 
    if (guest.rsvp === 'Attending') { badgeColor = '#d1fae5'; textColor = '#065f46'; }
    if (guest.rsvp === 'Declined') { badgeColor = '#fee2e2'; textColor = '#991b1b'; }

    return `
      <li class="guest-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; flex-wrap: wrap; gap: 10px;">
        <div>
          <div style="font-weight: bold; font-size: 1.1rem; color: #2b2b2b;">
            ${guest.name} <span style="font-size: 0.85rem; font-weight: normal; background: #f3f4f6; padding: 2px 8px; border-radius: 10px; margin-left: 5px;">${guest.pax || 1} Orang</span>
          </div>
          <div style="font-size: 0.8rem; color: #8a827a; margin-top: 4px;">
            ${guest.category} • Pihak: ${guest.side === 'Bride' ? 'Wanita' : guest.side === 'Groom' ? 'Pria' : 'Bersama'}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <select onchange="updateRsvp('${guest._id}', this.value)" style="padding: 5px; border-radius: 5px; border: 1px solid #ddd; background: ${badgeColor}; color: ${textColor}; font-weight: bold; cursor: pointer;">
            <option value="Pending" ${guest.rsvp === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Attending" ${guest.rsvp === 'Attending' ? 'selected' : ''}>Hadir</option>
            <option value="Declined" ${guest.rsvp === 'Declined' ? 'selected' : ''}>Batal</option>
          </select>
          <button class="btn-action btn-edit" onclick="editGuest('${guest._id}', '${guest.name.replace(/'/g, "\\'")}', ${guest.pax || 1})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-action btn-delete" onclick="deleteGuest('${guest._id}')" title="Hapus">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </li>
    `;
  }).join('');
}

window.addGuest = async function(e) {
  e.preventDefault();
  const id = document.getElementById('guest-id').value;
  const name = document.getElementById('guest-name').value;
  const pax = Number(document.getElementById('guest-pax').value);
  const category = document.getElementById('guest-category').value;
  const side = document.getElementById('guest-side').value;
  
  let data = { name, pax, category, side };
  if (!id) data.weddingId = currentWedding._id;

  try {
    if (id) {
      await api(`/guests/${id}`, 'PUT', data);
    } else {
      await api('/guests', 'POST', data);
    }
    window.cancelEditGuest();
    await loadGuests();
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  }
};

window.editGuest = function(id, name, pax) {
  document.getElementById('guest-id').value = id;
  document.getElementById('guest-name').value = name;
  document.getElementById('guest-pax').value = pax;
  document.getElementById('btn-submit-guest').textContent = 'Simpan Perubahan';
  document.getElementById('btn-cancel-edit').style.display = 'inline-block';
  document.getElementById('guest-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEditGuest = function() {
  document.getElementById('guest-id').value = '';
  document.getElementById('guest-form').reset();
  document.getElementById('btn-submit-guest').textContent = 'Tambah Tamu';
  document.getElementById('btn-cancel-edit').style.display = 'none';
};

window.updateRsvp = async function(id, rsvp) {
  await api(`/guests/${id}`, 'PUT', { rsvp });
  await loadGuests(); 
};

window.deleteGuest = async function(id) {
  if(confirm('Hapus tamu ini?')) {
    await api(`/guests/${id}`, 'DELETE');
    await loadGuests();
  }
};

window.filterGuests = function() {
  const input = document.getElementById('search-guest').value.toLowerCase();
  const items = document.querySelectorAll('.guest-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(input) ? 'flex' : 'none';
  });
};

window.filterStatus = function(status) {
  const items = document.querySelectorAll('.guest-item');
  items.forEach(item => {
    const select = item.querySelector('select');
    const rsvpValue = select ? select.value : 'Pending';
    item.style.display = (status === 'All' || rsvpValue === status) ? 'flex' : 'none';
  });
};

// ==========================================
// ===== FITUR VENUES & VENDORS =====
// ==========================================
async function loadVenues() {
  const items = await api(`/locations?weddingId=${currentWedding._id}`);
  const list = document.getElementById('venue-list');
  
  if (items.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#8a827a; padding: 1rem;">Belum ada daftar venue.</p>';
    return;
  }

  list.innerHTML = items.map(item => {
    const mapBtn = item.mapLink ? `<a href="${item.mapLink}" target="_blank" style="background: #C06C4C; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 5px; text-decoration: none; font-size: 0.85rem; font-weight: bold;">📍 Maps</a>` : '';

    return `
      <li style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; flex-wrap: wrap; gap: 10px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 1.1rem;">${item.name}</div>
          <div style="font-size: 0.85rem; color: #8a827a;">
            Estimasi: <strong>Rp ${item.estimatedCost.toLocaleString('id-ID')}</strong> | ${item.benefit}
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          ${mapBtn}
          <button class="btn-action btn-edit" onclick="editVenue('${item._id}', '${item.name}', ${item.estimatedCost}, '${item.benefit}', '${item.mapLink}')">✏️</button>
          <button class="btn-action btn-delete" onclick="deleteVenue('${item._id}')">🗑</button>
        </div>
      </li>
    `;
  }).join('');
}

window.addVenue = async function(e) {
  e.preventDefault();
  const id = document.getElementById('venue-id').value;
  const name = document.getElementById('venue-name').value;
  const estimatedCost = Number(document.getElementById('venue-cost').value);
  const benefit = document.getElementById('venue-benefit').value;
  const mapLink = document.getElementById('venue-map').value;
  
  let data = { name, estimatedCost, benefit, mapLink };
  if (!id) data.weddingId = currentWedding._id;

  if (id) {
    await api(`/locations/${id}`, 'PUT', data);
  } else {
    await api('/locations', 'POST', data);
  }
  window.cancelEditVenue();
  loadVenues();
};

window.editVenue = function(id, name, cost, benefit, map) {
  document.getElementById('venue-id').value = id;
  document.getElementById('venue-name').value = name;
  document.getElementById('venue-cost').value = cost;
  document.getElementById('venue-benefit').value = benefit;
  document.getElementById('venue-map').value = map;
  
  document.getElementById('btn-submit-venue').textContent = 'Simpan';
  document.getElementById('btn-cancel-venue').style.display = 'inline-block';
  document.getElementById('venue-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEditVenue = function() {
  document.getElementById('venue-id').value = '';
  document.getElementById('venue-form').reset();
  document.getElementById('btn-submit-venue').textContent = 'Tambah';
  document.getElementById('btn-cancel-venue').style.display = 'none';
};

window.deleteVenue = async function(id) {
  if(confirm('Hapus venue ini?')) {
    await api(`/locations/${id}`, 'DELETE');
    loadVenues();
  }
};

async function loadVendors() {
  const items = await api(`/vendors?weddingId=${currentWedding._id}`);
  const list = document.getElementById('vendor-list');
  
  if (items.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#8a827a; padding: 1rem;">Belum ada daftar vendor.</p>';
    return;
  }

  list.innerHTML = items.map(item => `
    <li style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; flex-wrap: wrap; gap: 10px;">
      <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 1.1rem;">
          ${item.name} <span style="font-size: 0.8rem; background: #f3f4f6; padding: 2px 6px; border-radius: 5px;">${item.category}</span>
        </div>
        <div style="font-size: 0.85rem; color: #8a827a;">
          Kontak: ${item.contact || '-'} | Estimasi: <strong>Rp ${item.estimatedCost.toLocaleString('id-ID')}</strong><br>
          <em>${item.benefit}</em>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-action btn-edit" onclick="editVendor('${item._id}', '${item.name}', '${item.category}', '${item.contact}', ${item.estimatedCost}, '${item.benefit}')">✏️</button>
        <button class="btn-action btn-delete" onclick="deleteVendor('${item._id}')">🗑</button>
      </div>
    </li>
  `).join('');
}

window.addVendor = async function(e) {
  e.preventDefault();
  const id = document.getElementById('vendor-id').value;
  const name = document.getElementById('vendor-name').value;
  const category = document.getElementById('vendor-category').value;
  const contact = document.getElementById('vendor-contact').value;
  const estimatedCost = Number(document.getElementById('vendor-cost').value);
  const benefit = document.getElementById('vendor-benefit').value;
  
  let data = { name, category, contact, estimatedCost, benefit };
  if (!id) data.weddingId = currentWedding._id;

  if (id) {
    await api(`/vendors/${id}`, 'PUT', data);
  } else {
    await api('/vendors', 'POST', data);
  }
  window.cancelEditVendor();
  loadVendors();
};

window.editVendor = function(id, name, category, contact, cost, benefit) {
  document.getElementById('vendor-id').value = id;
  document.getElementById('vendor-name').value = name;
  document.getElementById('vendor-category').value = category;
  document.getElementById('vendor-contact').value = contact;
  document.getElementById('vendor-cost').value = cost;
  document.getElementById('vendor-benefit').value = benefit;
  
  document.getElementById('btn-submit-vendor').textContent = 'Simpan';
  document.getElementById('btn-cancel-vendor').style.display = 'inline-block';
  document.getElementById('vendor-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEditVendor = function() {
  document.getElementById('vendor-id').value = '';
  document.getElementById('vendor-form').reset();
  document.getElementById('btn-submit-vendor').textContent = 'Tambah';
  document.getElementById('btn-cancel-vendor').style.display = 'none';
};

window.deleteVendor = async function(id) {
  if(confirm('Hapus vendor ini?')) {
    await api(`/vendors/${id}`, 'DELETE');
    loadVendors();
  }
};

// ==========================================
// ===== FITUR BUAT & GABUNG WEDDING =====
// ==========================================
window.createWedding = async function(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Memproses...';
  btn.disabled = true;
  try {
    await api('/wedding', 'POST', {
      coupleName: document.getElementById('couple-name').value,
      weddingDate: document.getElementById('wedding-date').value
    });
    window.location.reload();
  } catch (err) {
    alert(err.message);
    btn.textContent = 'Buat Wedding Plan';
    btn.disabled = false;
  }
};

window.joinWedding = async function(e) {
  e.preventDefault();
  const code = document.getElementById('invite-code').value;
  const btn = e.target.querySelector('button');
  btn.textContent = 'Menggabungkan...';
  btn.disabled = true;
  try {
    await api('/wedding/join', 'POST', { inviteCode: code });
    alert('Berhasil bergabung dengan pasangan!');
    window.location.reload();
  } catch (err) {
    alert(err.message);
    btn.textContent = 'Gabung';
    btn.disabled = false;
  }
};

window.addEventListener('resize', () => {
  if (currentWedding) drawSnakePath();
});

// ==========================================
// ===== FITUR ITINERARY =====
// ==========================================
async function loadItinerary() {
  const items = await api(`/itineraries?weddingId=${currentWedding._id}`);
  const list = document.getElementById('itinerary-list');
  
  if (items.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#8a827a; padding: 1rem;">Belum ada susunan acara.</p>';
    return;
  }

  list.innerHTML = items.map(item => `
    <li style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <div style="font-weight: bold; color: #ec4899; font-size: 1.1rem; min-width: 60px;">${item.time}</div>
        <div style="font-weight: bold; color: #2b2b2b; font-size: 1.05rem;">${item.title}</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-action btn-edit" onclick="editItinerary('${item._id}', '${item.time}', '${item.title.replace(/'/g, "\\'")}')" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-action btn-delete" onclick="deleteItinerary('${item._id}')" title="Hapus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </li>
  `).join('');
}

window.addItinerary = async function(e) {
  e.preventDefault();
  const id = document.getElementById('itinerary-id').value;
  const time = document.getElementById('itinerary-time').value;
  const title = document.getElementById('itinerary-title').value;
  
  let data = { time, title };
  if (!id) data.weddingId = currentWedding._id;

  if (id) await api(`/itineraries/${id}`, 'PUT', data);
  else await api('/itineraries', 'POST', data);
  
  window.cancelEditItinerary();
  loadItinerary();
};

window.editItinerary = function(id, time, title) {
  document.getElementById('itinerary-id').value = id;
  document.getElementById('itinerary-time').value = time;
  document.getElementById('itinerary-title').value = title;
  document.getElementById('btn-submit-itinerary').textContent = 'Simpan';
  document.getElementById('btn-cancel-itinerary').style.display = 'inline-block';
};

window.cancelEditItinerary = function() {
  document.getElementById('itinerary-id').value = '';
  document.getElementById('itinerary-form').reset();
  document.getElementById('btn-submit-itinerary').textContent = 'Tambah';
  document.getElementById('btn-cancel-itinerary').style.display = 'none';
};

window.deleteItinerary = async function(id) {
  if(confirm('Hapus acara ini?')) {
    await api(`/itineraries/${id}`, 'DELETE');
    loadItinerary();
  }
};

// ==========================================
// ===== FITUR NOTES =====
// ==========================================
async function loadNotes() {
  const items = await api(`/notes?weddingId=${currentWedding._id}`);
  const list = document.getElementById('note-list');
  
  if (items.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#8a827a; padding: 1rem;">Belum ada catatan.</p>';
    return;
  }

  list.innerHTML = items.map(item => `
    <li style="display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem; border-bottom: 1px solid #eee; flex-direction: column; gap: 10px;">
      <div style="width: 100%;">
        <div style="font-weight: bold; color: #2b2b2b; font-size: 1.1rem; margin-bottom: 4px;">${item.title}</div>
        <div style="font-size: 0.9rem; color: #4b5563; white-space: pre-wrap;">${item.content}</div>
      </div>
      <div style="display: flex; gap: 8px; align-self: flex-end;">
        <button class="btn-action btn-edit" onclick="editNote('${item._id}', '${item.title.replace(/'/g, "\\'")}', '${item.content.replace(/'/g, "\\'")}')" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-action btn-delete" onclick="deleteNote('${item._id}')" title="Hapus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </li>
  `).join('');
}

window.addNote = async function(e) {
  e.preventDefault();
  const id = document.getElementById('note-id').value;
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').value;
  
  let data = { title, content };
  if (!id) data.weddingId = currentWedding._id;

  if (id) await api(`/notes/${id}`, 'PUT', data);
  else await api('/notes', 'POST', data);
  
  window.cancelEditNote();
  loadNotes();
};

window.editNote = function(id, title, content) {
  document.getElementById('note-id').value = id;
  document.getElementById('note-title').value = title;
  document.getElementById('note-content').value = content;
  document.getElementById('btn-submit-note').textContent = 'Simpan';
  document.getElementById('btn-cancel-note').style.display = 'inline-block';
};

window.cancelEditNote = function() {
  document.getElementById('note-id').value = '';
  document.getElementById('note-form').reset();
  document.getElementById('btn-submit-note').textContent = 'Tambah';
  document.getElementById('btn-cancel-note').style.display = 'none';
};

window.deleteNote = async function(id) {
  if(confirm('Hapus catatan ini?')) {
    await api(`/notes/${id}`, 'DELETE');
    loadNotes();
  }
};