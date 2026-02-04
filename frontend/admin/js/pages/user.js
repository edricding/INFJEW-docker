let activeResetUserId = null;

window.addEventListener("DOMContentLoaded", function () {
  fetchUsers();
  bindResetPasswordActions();
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
      <th style="width: 140px;">Action</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  if (users.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="3" class="text-muted">No users found.</td>
    `;
    tbody.appendChild(emptyRow);
  } else {
    users.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${escapeHtml(user.username || "")}</td>
        <td>
          <button type="button"
            class="btn btn-warning btn-icon btn-sm reset-password-btn"
            data-bs-toggle="modal"
            data-bs-target="#ResetPasswordModal"
            data-id="${user.id}">
            <i class="ti ti-password"></i>
          </button>
        </td>
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

function bindResetPasswordActions() {
  const tableContainer = document.getElementById("table-gridjs");
  if (tableContainer) {
    tableContainer.addEventListener("click", function (e) {
      const btn = e.target.closest(".reset-password-btn");
      if (!btn) {
        return;
      }
      activeResetUserId = parseInt(btn.getAttribute("data-id"), 10);
      clearResetPasswordForm();
    });
  }

  const submitBtn = document.getElementById("reset-password-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      const passwordEl = document.getElementById("reset-password");
      const confirmEl = document.getElementById("reset-password-confirm");

      const password = passwordEl ? passwordEl.value : "";
      const confirm = confirmEl ? confirmEl.value : "";

      if (!activeResetUserId || !password || !confirm) {
        showResetPasswordMsg("Please enter and confirm the new password.");
        return;
      }
      if (password !== confirm) {
        showResetPasswordMsg("Passwords do not match.");
        return;
      }

      submitBtn.disabled = true;
      fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: activeResetUserId,
          password: password,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            showResetPasswordMsg("");
            const modalEl = document.getElementById("ResetPasswordModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
              modal.hide();
            }
            clearResetPasswordForm();
            return;
          }
          showResetPasswordMsg((data && data.message) || "Update failed.");
        })
        .catch((err) => {
          console.error("Password reset failed", err);
          showResetPasswordMsg("Update failed.");
        })
        .finally(() => {
          submitBtn.disabled = false;
        });
    });
  }
}

function clearResetPasswordForm() {
  const passwordEl = document.getElementById("reset-password");
  const confirmEl = document.getElementById("reset-password-confirm");
  if (passwordEl) passwordEl.value = "";
  if (confirmEl) confirmEl.value = "";
  showResetPasswordMsg("");
}

function showResetPasswordMsg(msg) {
  const msgEl = document.getElementById("reset-password-msg");
  if (!msgEl) {
    return;
  }
  if (!msg) {
    msgEl.style.display = "none";
    msgEl.textContent = "";
    return;
  }
  msgEl.textContent = msg;
  msgEl.style.display = "block";
}

