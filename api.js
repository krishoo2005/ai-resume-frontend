// Backend base URL 
const API_BASE_URL = "https://airesume.mooo.com";

//  Auth helpers 
function getToken() {
  return localStorage.getItem("token");
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

function logout() {
  const token = getToken();
  if (token) {
    fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    }).finally(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("lastDocumentId");
      window.location.href = "login.html";
    });
  } else {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}

// Core request helper 
async function apiRequest(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let finalBody = body;
  if (body && !isForm) {
    headers["Content-Type"] = "application/json";
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: finalBody,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data && data.detail;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

// Status polling
function pollStatus(documentId, onUpdate, intervalMs = 2000) {
  const poll = async () => {
    try {
      const data = await apiRequest(`/status/${documentId}`);
      onUpdate(data);

      if (data.status === "PENDING" || data.status === "PROCESSING") {
        setTimeout(poll, intervalMs);
      }
    } catch (err) {
      onUpdate({ status: "FAILED", error: err.message });
    }
  };

  poll();
}

// Status badge UI 
function updateStatusBadge(badgeEl, textEl, status) {
  badgeEl.className = `status-badge ${status}`;
  textEl.textContent = status;
}