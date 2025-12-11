// Minimal Web Client for Collaborative Learning Platform
// Works against the server served at the same origin (localhost:3000)

(function () {
  const $ = (id) => document.getElementById(id);

  // State
  const state = {
    tokenKey: 'clp_token',
    devKey: 'clp_dev_visible',
  };

  // Toast / popup notifications
  function notify(message, type = 'info', timeoutMs = 3800) {
    try {
      const host = $('toasts');
      if (!host) return;
      const el = document.createElement('div');
      el.className = `toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warn' ? 'warn' : ''}`;
      el.setAttribute('role', 'status');
      el.innerHTML = `
        <div class="msg">${escapeHtml(String(message || ''))}</div>
        <button class="toast-close" aria-label="Close">✕</button>
      `;
      const close = () => {
        try {
          el.style.animation = 'toast-out 140ms ease-in forwards';
          setTimeout(() => el.remove(), 160);
        } catch { /* noop */ }
      };
      el.querySelector('.toast-close')?.addEventListener('click', close);
      // Remove on click anywhere on toast
      el.addEventListener('click', (ev) => {
        if (!(ev.target instanceof HTMLButtonElement)) close();
      });
      host.prepend(el);
      if (timeoutMs > 0) setTimeout(close, timeoutMs);
    } catch { /* ignore toast errors */ }
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load/Store token
  function getToken() {
    return localStorage.getItem(state.tokenKey) || '';
  }
  function setToken(t) {
    if (t) localStorage.setItem(state.tokenKey, t);
    else localStorage.removeItem(state.tokenKey);
    renderToken();
  }
  function renderToken() {
    const t = getToken();
    const el = $('tokenDisplay');
    if (el) el.textContent = t ? t : '<no token>';
  }

  // Output helpers
  function setLast(meta) {
    const m = $('lastMethod');
    const u = $('lastUrl');
    const s = $('lastStatus');
    const t = $('lastTime');
    if (m) m.textContent = meta.method || '';
    if (u) u.textContent = meta.url || '';
    if (s) s.textContent = String(meta.status ?? '');
    if (t) t.textContent = meta.time ? meta.time + 'ms' : '';
  }
  function show(data) {
    try {
      const out = $('out');
      if (!out) return;
      out.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (e) {
      const out = $('out');
      if (out) out.textContent = String(data);
    }
  }

  // Generic fetch with notifications
  async function api(method, url, body, isFormData) {
    const started = Date.now();
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (!isFormData) headers['Content-Type'] = 'application/json';
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      });
      const time = Date.now() - started;
      let data;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      setLast({ method, url, status: res.status, time });
      show(data);
      if (!res.ok) {
        const msg = extractMessage(data) || `Request failed (${res.status})`;
        notify(msg, 'error');
        const err = new Error(msg);
        err.__notified = true;
        throw err;
      }
      // Show success message for mutating requests if server returned a message
      if (method !== 'GET') {
        const msg = extractMessage(data);
        if (msg) notify(msg, 'success');
      }
      return data;
    } catch (err) {
      const time = Date.now() - started;
      setLast({ method, url, status: 'ERR', time });
      if (!err.__notified) {
        notify(err.message || 'Network error', 'error');
      }
      throw err;
    }
  }

  function extractMessage(data) {
    try {
      if (!data) return '';
      if (typeof data === 'string') return data;
      if (data.message) return String(data.message);
      if (data.error) return String(data.error);
      if (Array.isArray(data.errors) && data.errors.length) {
        const first = data.errors[0];
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object') return String(first.message || first.msg || JSON.stringify(first));
      }
      return '';
    } catch { return ''; }
  }

  // Developer tools visibility
  function parseBool(v) {
    if (typeof v !== 'string') return undefined;
    const s = v.trim().toLowerCase();
    if (s === '1' || s === 'true' || s === 'yes') return true;
    if (s === '0' || s === 'false' || s === 'no') return false;
    return undefined;
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has(name)) return undefined;
    return params.get(name);
  }

  function getDevVisibleInitial() {
    const q = getQueryParam('dev');
    const fromQuery = parseBool(q);
    if (fromQuery !== undefined) return fromQuery;
    const stored = localStorage.getItem(state.devKey);
    const parsed = parseBool(stored);
    return parsed === undefined ? false : parsed;
  }

  function setDevVisible(visible, persist = true) {
    const devTools = document.getElementById('devTools');
    const devHeader = document.getElementById('devHeader');
    const btn = document.getElementById('btnToggleDev');
    if (devTools) {
      devTools.classList.toggle('hidden', !visible);
      devTools.setAttribute('aria-hidden', String(!visible));
    }
    if (devHeader) {
      devHeader.classList.toggle('hidden', !visible);
      devHeader.setAttribute('aria-hidden', String(!visible));
    }
    if (btn) btn.textContent = visible ? 'Hide technical details' : 'Show technical details';
    if (persist) localStorage.setItem(state.devKey, String(visible));
  }

  // Bind header controls
  const btnToggleDev = $('btnToggleDev');
  if (btnToggleDev) {
    btnToggleDev.addEventListener('click', () => {
      const current = (localStorage.getItem(state.devKey) || 'false').toLowerCase();
      const next = !(current === 'true' || current === '1');
      setDevVisible(next, true);
    });
  }

  const copyBtn = $('btnCopyToken');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const t = getToken();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      notify('Token copied to clipboard', 'success', 2200);
    } catch {}
  });
  const clearBtn = $('btnClearToken');
  if (clearBtn) clearBtn.addEventListener('click', () => setToken(''));

  // AUTH
  $('btnRegister').addEventListener('click', async () => {
    const body = {
      username: $('reg_username').value.trim(),
      email: $('reg_email').value.trim(),
      password: $('reg_password').value,
      role: $('reg_role').value,
      firstName: $('reg_firstName').value.trim(),
      lastName: $('reg_lastName').value.trim(),
    };
    const res = await api('POST', '/api/auth/register', body);
    if (res && res.token) setToken(res.token);
  });

  $('btnLogin').addEventListener('click', async () => {
    const body = {
      email: $('login_email').value.trim(),
      password: $('login_password').value,
    };
    const res = await api('POST', '/api/auth/login', body);
    if (res && res.token) setToken(res.token);
  });

  $('btnMe').addEventListener('click', () => api('GET', '/api/auth/me'));
  $('btnLogout').addEventListener('click', async () => {
    await api('POST', '/api/auth/logout');
    setToken('');
  });

  // CLASSROOMS
  $('btnClassroomsList').addEventListener('click', () => api('GET', '/api/classrooms'));

  $('btnClassroomCreate').addEventListener('click', () => {
    const body = {
      name: $('cl_name').value.trim(),
      subject: $('cl_subject').value.trim(),
      description: $('cl_description').value.trim(),
    };
    return api('POST', '/api/classrooms', body);
  });

  $('btnClassroomGet').addEventListener('click', () => {
    const id = $('cl_id').value.trim();
    if (!id) return show('Provide classroomId');
    return api('GET', `/api/classrooms/${encodeURIComponent(id)}`);
  });

  $('btnClassroomMembers').addEventListener('click', () => {
    const id = $('cl_id').value.trim();
    if (!id) return show('Provide classroomId');
    return api('GET', `/api/classrooms/${encodeURIComponent(id)}/members`);
  });

  $('btnClassroomJoinById').addEventListener('click', () => {
    const id = $('cl_id').value.trim();
    if (!id) return show('Provide classroomId');
    return api('POST', `/api/classrooms/${encodeURIComponent(id)}/join`, {});
  });

  $('btnClassroomLeave').addEventListener('click', () => {
    const id = $('cl_id').value.trim();
    if (!id) return show('Provide classroomId');
    return api('POST', `/api/classrooms/${encodeURIComponent(id)}/leave`, {});
  });

  $('btnClassroomUpdate').addEventListener('click', () => {
    const id = $('cl_id').value.trim();
    if (!id) return show('Provide classroomId');
    const body = {
      name: $('cl_upd_name').value.trim() || undefined,
      subject: $('cl_upd_subject').value.trim() || undefined,
      description: $('cl_upd_description').value.trim() || undefined,
    };
    return api('PUT', `/api/classrooms/${encodeURIComponent(id)}`, body);
  });

  $('btnClassroomDelete').addEventListener('click', () => {
    const id = $('cl_id').value.trim();
    if (!id) return show('Provide classroomId');
    return api('DELETE', `/api/classrooms/${encodeURIComponent(id)}`);
  });

  $('btnClassroomJoinByCode').addEventListener('click', () => {
    const code = $('cl_code').value.trim();
    if (!code) return show('Provide classCode');
    return api('POST', '/api/classrooms/join', { classCode: code });
  });

  // ASSIGNMENTS
  $('btnAssignList').addEventListener('click', () => {
    const cid = $('as_classroomId').value.trim();
    if (!cid) return show('Provide classroomId');
    return api('GET', `/api/assignments/classroom/${encodeURIComponent(cid)}`);
  });

  $('btnAssignGet').addEventListener('click', () => {
    const id = $('as_id').value.trim();
    if (!id) return show('Provide assignmentId');
    return api('GET', `/api/assignments/${encodeURIComponent(id)}`);
  });

  $('btnAssignDelete').addEventListener('click', () => {
    const id = $('as_id').value.trim();
    if (!id) return show('Provide assignmentId');
    return api('DELETE', `/api/assignments/${encodeURIComponent(id)}`);
  });

  $('btnAssignPublish').addEventListener('click', () => {
    const id = $('as_id').value.trim();
    if (!id) return show('Provide assignmentId');
    return api('PUT', `/api/assignments/${encodeURIComponent(id)}/publish`, {});
  });

  $('btnAssignCreate').addEventListener('click', () => {
    const attachments = safeJson($('as_attachments').value);
    const body = {
      title: $('as_title').value.trim(),
      description: $('as_description').value.trim(),
      classroom: $('as_classroom').value.trim(),
      dueDate: $('as_dueDate').value.trim(),
      totalPoints: numOrUndefined($('as_totalPoints').value),
      instructions: $('as_instructions').value.trim() || undefined,
      allowLateSubmission: $('as_allowLate').checked,
      lateSubmissionPenalty: numOrUndefined($('as_latePenalty').value),
      attachments: Array.isArray(attachments) ? attachments : undefined,
    };
    return api('POST', '/api/assignments', body);
  });

  $('btnAssignUpdate').addEventListener('click', () => {
    const id = $('as_id').value.trim();
    if (!id) return show('Provide assignmentId');
    const attachments = safeJson($('as_attachments').value);
    const body = {
      title: $('as_title').value.trim() || undefined,
      description: $('as_description').value.trim() || undefined,
      classroom: $('as_classroom').value.trim() || undefined,
      dueDate: $('as_dueDate').value.trim() || undefined,
      totalPoints: numOrUndefined($('as_totalPoints').value),
      instructions: $('as_instructions').value.trim() || undefined,
      allowLateSubmission: $('as_allowLate').checked,
      lateSubmissionPenalty: numOrUndefined($('as_latePenalty').value),
      attachments: Array.isArray(attachments) ? attachments : undefined,
    };
    return api('PUT', `/api/assignments/${encodeURIComponent(id)}`, body);
  });

  // SUBMISSIONS
  $('btnSubCreate').addEventListener('click', () => {
    const attachments = safeJson($('sub_attachments').value);
    const body = {
      assignment: $('sub_assignment').value.trim(),
      content: $('sub_content').value.trim() || undefined,
      attachments: Array.isArray(attachments) ? attachments : undefined,
      status: $('sub_status').value.trim() || undefined,
    };
    return api('POST', '/api/submissions', body);
  });

  $('btnSubMy').addEventListener('click', () => {
    const id = $('sub_as_id').value.trim();
    if (!id) return show('Provide assignmentId');
    return api('GET', `/api/submissions/assignment/${encodeURIComponent(id)}/my-submission`);
  });

  $('btnSubAll').addEventListener('click', () => {
    const id = $('sub_as_id').value.trim();
    if (!id) return show('Provide assignmentId');
    return api('GET', `/api/submissions/assignment/${encodeURIComponent(id)}`);
  });

  $('btnSubGrade').addEventListener('click', () => {
    const id = $('sub_id').value.trim();
    if (!id) return show('Provide submissionId');
    const body = {
      grade: numOrUndefined($('sub_grade').value),
      feedback: $('sub_feedback').value.trim() || undefined,
    };
    return api('PUT', `/api/submissions/${encodeURIComponent(id)}/grade`, body);
  });

  $('btnSubDelete').addEventListener('click', () => {
    const id = $('sub_id').value.trim();
    if (!id) return show('Provide submissionId');
    return api('DELETE', `/api/submissions/${encodeURIComponent(id)}`);
  });

  // UPLOAD (multipart)
  $('btnUploadSingle').addEventListener('click', async () => {
    const fileInput = $('up_single');
    if (!fileInput.files || fileInput.files.length === 0) return show('Choose a file');
    const fd = new FormData();
    fd.append('file', fileInput.files[0]);
    return api('POST', '/api/upload/assignment', fd, true);
  });

  $('btnUploadMultiple').addEventListener('click', async () => {
    const fileInput = $('up_multiple');
    if (!fileInput.files || fileInput.files.length === 0) return show('Choose files');
    const fd = new FormData();
    for (const f of fileInput.files) fd.append('files', f);
    return api('POST', '/api/upload/assignment/multiple', fd, true);
  });

  $('btnUploadInfo').addEventListener('click', () => {
    const pid = $('up_publicId').value.trim();
    if (!pid) return show('Provide publicId');
    return api('GET', `/api/upload/info/${encodeURIComponent(pid)}`);
  });

  $('btnUploadDelete').addEventListener('click', () => {
    const pid = $('up_publicId').value.trim();
    if (!pid) return show('Provide publicId');
    return api('DELETE', `/api/upload/${encodeURIComponent(pid)}`);
  });

  // Utilities
  function safeJson(str) {
    const s = (str || '').trim();
    if (!s) return undefined;
    try { return JSON.parse(s); } catch { return undefined; }
  }
  function numOrUndefined(v) {
    const s = (v || '').trim();
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }

  // Init
  renderToken();
  setDevVisible(getDevVisibleInitial(), false);

  // Global error surfacing
  window.addEventListener('error', (e) => {
    const msg = e?.message || 'Unexpected error';
    const notified = e?.error && e.error.__notified;
    if (!notified) notify(msg, 'error');
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e?.reason;
    const msg = (reason && (reason.message || String(reason))) || 'Unexpected error';
    const notified = reason && reason.__notified;
    if (!notified) notify(msg, 'error');
  });
})();
