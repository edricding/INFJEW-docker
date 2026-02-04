window.addEventListener("DOMContentLoaded", function () {
  fetchUsers();
});

function fetchUsers() {
  fetch("/api/users", {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.success) {
        renderError((data && data.message) || "Failed to load users.");
        return;
      }
      renderUsersTable(Array.isArray(data.data) ? data.data : []);
    })
    .catch((err) => {
      console.error("Failed to load users", err);
      renderError("Failed to load users.");
    });
}

function renderUsersTable(users) {
  const container = document.getElementById("table-gridjs");
  if (!container) {
    return;
  }

  const table = document.createElement("table");
  table.className = "table table-sm mb-0";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th style="width: 80px;">ID</th>
      <th>Username</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  if (users.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="2" class="text-muted">No users found.</td>
    `;
    tbody.appendChild(emptyRow);
  } else {
    users.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${escapeHtml(user.username || "")}</td>
      `;
      tbody.appendChild(row);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  container.innerHTML = "";
  container.appendChild(table);
}

function renderError(message) {
  const container = document.getElementById("table-gridjs");
  if (!container) {
    return;
  }
  container.innerHTML = `
    <div class="text-danger">${escapeHtml(message)}</div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

