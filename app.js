// ============================================================
// ESTADO
// ============================================================
let clients = [];
let currentFilter = 'todos';
let searchTerm = '';
let editingId = null;
let isSignupMode = false;
let unsubscribeClients = null;

const PLAN_DAYS = { 'Mensal': 30, 'Trimestral': 90, 'Semestral': 180, 'Anual': 365 };

// ============================================================
// HELPERS DE DATA
// ============================================================
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function daysBetween(dateStr) {
  const today = new Date(todayStr() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}
function formatDateBR(dateStr) {
  const [y,m,d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
function getStatus(dateStr) {
  const diff = daysBetween(dateStr);
  if (diff < 0) return 'vencido';
  if (diff === 0) return 'hoje';
  if (diff <= 7) return 'avencer';
  return 'emdia';
}
function statusLabel(status, diff) {
  if (status === 'vencido') return `venceu há ${Math.abs(diff)} dia${Math.abs(diff)===1?'':'s'}`;
  if (status === 'hoje') return 'vence hoje';
  if (status === 'avencer') return `vence em ${diff} dia${diff===1?'':'s'}`;
  return `vence em ${diff} dias`;
}
function statusBadge(status) {
  const map = {
    vencido: ['status-vencido', 'Vencido'],
    hoje: ['status-hoje', 'Vence hoje'],
    avencer: ['status-avencer', 'A vencer'],
    emdia: ['status-emdia', 'Em dia']
  };
  const [cls, label] = map[status];
  return `<span class="status-badge ${cls}"><span class="sdot"></span>${label}</span>`;
}

// ============================================================
// TOAST
// ============================================================
function toast(msg) {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ============================================================
// AUTH
// ============================================================
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const loginTitle = document.getElementById('login-title');
const toggleMode = document.getElementById('toggle-mode');
const toggleWrap = document.getElementById('toggle-wrap');

toggleMode.addEventListener('click', () => {
  isSignupMode = !isSignupMode;
  loginTitle.textContent = isSignupMode ? 'Crie sua conta para começar' : 'Entre para gerenciar seus clientes';
  loginBtn.textContent = isSignupMode ? 'Criar conta' : 'Entrar';
  toggleWrap.innerHTML = isSignupMode
    ? 'Já tem conta? <a id="toggle-mode">Entrar</a>'
    : 'Ainda não tem conta? <a id="toggle-mode">Criar conta</a>';
  document.getElementById('toggle-mode').addEventListener('click', () => toggleMode.click());
  loginError.style.display = 'none';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  loginBtn.disabled = true;
  loginBtn.textContent = isSignupMode ? 'Criando...' : 'Entrando...';
  try {
    if (isSignupMode) {
      await auth.createUserWithEmailAndPassword(email, password);
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  } catch (err) {
    loginError.textContent = translateAuthError(err.code);
    loginError.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = isSignupMode ? 'Criar conta' : 'Entrar';
  }
});

function translateAuthError(code) {
  const map = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/configuration-not-found': 'Configure o Firebase: ative "E-mail/senha" em Authentication > Sign-in method.'
  };
  return map[code] || 'Erro: ' + code;
}

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').classList.add('show');
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-initial').textContent = user.email[0].toUpperCase();
    listenToClients(user.uid);
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').classList.remove('show');
    if (unsubscribeClients) { unsubscribeClients(); unsubscribeClients = null; }
    clients = [];
  }
});

// ============================================================
// FIRESTORE - CLIENTES
// ============================================================
function clientsCollection(uid) {
  return db.collection('users').doc(uid).collection('clients');
}

function listenToClients(uid) {
  if (unsubscribeClients) unsubscribeClients();
  unsubscribeClients = clientsCollection(uid).orderBy('vencimento', 'asc')
    .onSnapshot((snap) => {
      clients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }, (err) => {
      console.error(err);
      toast('Erro ao carregar clientes: ' + err.message);
    });
}

async function saveClient(data) {
  const uid = auth.currentUser.uid;
  if (editingId) {
    await clientsCollection(uid).doc(editingId).update(data);
    toast('Cliente atualizado.');
  } else {
    await clientsCollection(uid).add(data);
    toast('Cliente cadastrado.');
  }
}

async function renovarClient(client) {
  const uid = auth.currentUser.uid;
  const days = PLAN_DAYS[client.plano] || 30;
  const base = daysBetween(client.vencimento) < 0 ? todayStr() : client.vencimento;
  const novaData = addDays(base, days);
  await clientsCollection(uid).doc(client.id).update({ vencimento: novaData });
  toast(`Renovado até ${formatDateBR(novaData)}.`);
}

async function deleteClient(id) {
  if (!confirm('Excluir este cliente? Essa ação não pode ser desfeita.')) return;
  const uid = auth.currentUser.uid;
  await clientsCollection(uid).doc(id).delete();
  toast('Cliente excluído.');
}

// ============================================================
// RENDER
// ============================================================
function render() {
  const tbody = document.getElementById('clients-tbody');
  const emptyState = document.getElementById('empty-state');

  const counts = { todos: clients.length, emdia: 0, avencer: 0, hoje: 0, vencido: 0 };
  clients.forEach(c => counts[getStatus(c.vencimento)]++);
  document.getElementById('count-todos').textContent = counts.todos;
  document.getElementById('count-emdia').textContent = counts.emdia;
  document.getElementById('count-avencer').textContent = counts.avencer;
  document.getElementById('count-hoje').textContent = counts.hoje;
  document.getElementById('count-vencido').textContent = counts.vencido;

  let filtered = clients.filter(c => {
    if (currentFilter !== 'todos' && getStatus(c.vencimento) !== currentFilter) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      return (c.nome||'').toLowerCase().includes(t) ||
             (c.usuario||'').toLowerCase().includes(t) ||
             (c.celular||'').toLowerCase().includes(t);
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map(c => {
    const status = getStatus(c.vencimento);
    const diff = daysBetween(c.vencimento);
    return `
      <tr>
        <td>
          <div class="cli-name">${escapeHtml(c.nome)}</div>
          <div class="cli-user">@${escapeHtml(c.usuario)} ${escapeHtml(c.plano||'')}</div>
        </td>
        <td>${escapeHtml(c.celular)}</td>
        <td>
          <div class="plano">${escapeHtml(c.plano||'-')}</div>
          <div class="plano-sub">${escapeHtml(c.pagamento||'-')}</div>
        </td>
        <td><span class="valor">R$ ${Number(c.valor||0).toFixed(2).replace('.',',')}</span></td>
        <td>
          <div class="venc-date">${formatDateBR(c.vencimento)}</div>
          <div class="venc-sub ${status}">${statusLabel(status, diff)}</div>
        </td>
        <td>${statusBadge(status)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-sm" onclick="openEdit('${c.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Editar
            </button>
            <button class="btn-sm renovar" onclick="handleRenovar('${c.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              Renovar
            </button>
            <button class="btn-sm del" onclick="handleDelete('${c.id}')" title="Excluir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function handleRenovar(id) {
  const c = clients.find(x => x.id === id);
  if (c) renovarClient(c);
}
function handleDelete(id) {
  deleteClient(id);
}

// ============================================================
// FILTROS E BUSCA
// ============================================================
document.getElementById('filter-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  currentFilter = tab.dataset.filter;
  render();
});

document.getElementById('search-input').addEventListener('input', (e) => {
  searchTerm = e.target.value;
  render();
});

// ============================================================
// MODAL NOVO / EDITAR CLIENTE
// ============================================================
const modal = document.getElementById('client-modal');
const clientForm = document.getElementById('client-form');

function openNew() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Novo cliente';
  clientForm.reset();
  document.getElementById('f-vencimento').value = addDays(todayStr(), 30);
  document.getElementById('f-pagamento').value = 'Pix';
  document.getElementById('f-plano').value = 'Mensal';
  modal.classList.add('show');
}

function openEdit(id) {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Editar cliente';
  document.getElementById('f-nome').value = c.nome || '';
  document.getElementById('f-usuario').value = c.usuario || '';
  document.getElementById('f-celular').value = c.celular || '';
  document.getElementById('f-pagamento').value = c.pagamento || 'Pix';
  document.getElementById('f-plano').value = c.plano || 'Mensal';
  document.getElementById('f-valor').value = c.valor || '';
  document.getElementById('f-vencimento').value = c.vencimento || todayStr();
  modal.classList.add('show');
}

function closeModal() {
  modal.classList.remove('show');
  editingId = null;
}

document.getElementById('open-new-client').addEventListener('click', openNew);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

clientForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando...';
  try {
    const data = {
      nome: document.getElementById('f-nome').value.trim(),
      usuario: document.getElementById('f-usuario').value.trim(),
      celular: document.getElementById('f-celular').value.trim(),
      pagamento: document.getElementById('f-pagamento').value,
      plano: document.getElementById('f-plano').value,
      valor: parseFloat(document.getElementById('f-valor').value) || 0,
      vencimento: document.getElementById('f-vencimento').value
    };
    await saveClient(data);
    closeModal();
  } catch (err) {
    toast('Erro ao salvar: ' + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar cliente';
  }
});
