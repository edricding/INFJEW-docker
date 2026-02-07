window.preciousListData = [];
let preciousInfoQuill = null;

const PRECIOUS_INDEX = {
  ID: 0,
  ITEM_ID: 1,
  TITLE: 2,
  TYPE: 3,
  TAG: 4,
  PRICE: 5,
  DISCOUNT: 6,
  RATING: 7,
  STATUS: 8,
  URL: 9,
  PIC_URL: 10,
  ACTION_ID: 11,
};

window.addEventListener("DOMContentLoaded", function () {
  Promise.all([initializePreciousMetaOptions(), fetchAndRenderPreciousList()]).finally(function () {
    initializePreciousInfoEditor();
    addEventListenerAfterDOMLoaded();
  });
});

function initializePreciousInfoEditor() {
  if (preciousInfoQuill || typeof Quill !== "function") {
    return;
  }

  const editorContainer = document.getElementById("precious-info-desc");
  if (!editorContainer) {
    return;
  }

  preciousInfoQuill = new Quill("#precious-info-desc", {
    theme: "snow",
    modules: {
      toolbar: [
        [{ font: [] }, { size: [] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ script: "super" }, { script: "sub" }],
        [{ header: [false, 1, 2, 3, 4, 5, 6] }, "blockquote", "code-block"],
        [
          { list: "ordered" },
          { list: "bullet" },
          { indent: "-1" },
          { indent: "+1" },
        ],
        ["direction", { align: [] }],
        ["link", "image", "video"],
        ["clean"],
      ],
    },
  });
}

function setPreciousInfoDescValue(desc) {
  initializePreciousInfoEditor();
  if (!preciousInfoQuill) {
    return;
  }

  if (desc == null) {
    preciousInfoQuill.setText("");
    return;
  }

  if (typeof desc === "string") {
    preciousInfoQuill.clipboard.dangerouslyPasteHTML(desc);
    return;
  }

  if (typeof desc === "object" && Array.isArray(desc.ops)) {
    preciousInfoQuill.setContents(desc);
    return;
  }

  preciousInfoQuill.setText(JSON.stringify(desc, null, 2));
}

function fillPreciousInfoModalFromList(result) {
  if (!result || result.length < 11) {
    return;
  }

  document.getElementById("precious-info-id").value = result[PRECIOUS_INDEX.ID] ?? "";
  document.getElementById("precious-info-code").value = result[PRECIOUS_INDEX.ITEM_ID] ?? "";
  document.getElementById("precious-info-name").value = result[PRECIOUS_INDEX.TITLE] ?? "";
  document.getElementById("precious-info-price").value = result[PRECIOUS_INDEX.PRICE] ?? "";
  document.getElementById("precious-info-type").value = result[PRECIOUS_INDEX.TYPE] ?? "";
  document.getElementById("precious-info-tag").value = result[PRECIOUS_INDEX.TAG] ?? "";
  document.getElementById("precious-info-picture-url").value = result[PRECIOUS_INDEX.PIC_URL] ?? "";
  setPreciousInfoDescValue(null);
}

function fillPreciousInfoModal(info) {
  if (!info) {
    return;
  }

  document.getElementById("precious-info-id").value = info.precious_id ?? "";
  document.getElementById("precious-info-code").value = info.precious_code ?? "";
  document.getElementById("precious-info-name").value = info.precious_name ?? "";
  document.getElementById("precious-info-type").value = info.precious_type ?? "";
  document.getElementById("precious-info-tag").value = info.precious_tag ?? "";

  const officialPrice =
    typeof info.precious_official_price === "number" ? info.precious_official_price : "";
  document.getElementById("precious-info-price").value = officialPrice;

  const pictures = Array.isArray(info.precious_pictures) ? info.precious_pictures : [];
  document.getElementById("precious-info-picture-url").value = pictures[0] || "";

  setPreciousInfoDescValue(info.precious_desc);
}

function fetchPreciousInfoByPreciousID(preciousID) {
  return fetch(`/api/precious/info?precious_id=${encodeURIComponent(preciousID)}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.success) {
        throw new Error((data && data.message) || "Failed to load precious info");
      }
      return data.data;
    });
}

function initializePreciousMetaOptions() {
  return fetch("/api/precious/meta", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.success || !data.data) {
        return;
      }

      const types = Array.isArray(data.data.types) ? data.data.types : [];
      const tags = Array.isArray(data.data.tags) ? data.data.tags : [];

      populateSelect("add-precious-type", types);
      populateSelect("edit-precious-type", types);
      populateSelect("add-precious-tag", tags);
      populateSelect("edit-precious-tag", tags);
    })
    .catch((err) => {
      console.error("Failed to load precious meta options", err);
    });
}

function populateSelect(selectId, values) {
  const select = document.getElementById(selectId);
  if (!select) {
    return;
  }

  const selectedValue = select.value;
  const options = Array.isArray(values) ? values : [];

  select.innerHTML = "";
  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  if (selectedValue && options.includes(selectedValue)) {
    select.value = selectedValue;
  }
}

function ensureSelectHasValue(selectId, value) {
  const select = document.getElementById(selectId);
  if (!select || !value) {
    return;
  }

  const exists = Array.from(select.options).some((option) => option.value === value);
  if (!exists) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }

  select.value = value;
}

function fillEditForm(result) {
  if (!result || result.length < 11) {
    return;
  }

  document.getElementById("edit-precious-id").value = result[PRECIOUS_INDEX.ID];
  document.getElementById("edit-precious-itemid").value = result[PRECIOUS_INDEX.ITEM_ID];
  document.getElementById("edit-precious-title").value = result[PRECIOUS_INDEX.TITLE];
  document.getElementById("edit-precious-price").value = result[PRECIOUS_INDEX.PRICE];

  const statusRadioId = `edit-statusRadio${result[PRECIOUS_INDEX.STATUS]}`;
  const radio = document.getElementById(statusRadioId);
  if (radio) {
    radio.checked = true;
    radio.setAttribute("checked", "checked");
  }

  const discountInput = document.getElementById("edit-precious-discount");
  if (result[PRECIOUS_INDEX.STATUS] === 2) {
    discountInput.disabled = false;
    discountInput.value = result[PRECIOUS_INDEX.DISCOUNT] !== "-" ? result[PRECIOUS_INDEX.DISCOUNT] : "";
  } else {
    discountInput.disabled = true;
    discountInput.value = "";
  }

  ensureSelectHasValue("edit-precious-type", result[PRECIOUS_INDEX.TYPE]);
  ensureSelectHasValue("edit-precious-tag", result[PRECIOUS_INDEX.TAG]);

  const ratingSelect = document.getElementById("edit-rating-select");
  const selectedRating = Number(result[PRECIOUS_INDEX.RATING]);
  for (let i = 0; i < ratingSelect.options.length; i += 1) {
    const optionRating = Number.parseFloat(ratingSelect.options[i].value);
    if (Math.abs(optionRating - selectedRating) < 0.001) {
      ratingSelect.selectedIndex = i;
      break;
    }
  }

  document.getElementById("edit-precious-url").value = result[PRECIOUS_INDEX.URL];
  document.getElementById("edit-precious-picture-url").value = result[PRECIOUS_INDEX.PIC_URL];
}

function clearPreciousForm() {
  document.getElementById("edit-precious-id").value = "";
  document.getElementById("edit-precious-itemid").value = "";
  document.getElementById("edit-precious-title").value = "";
  document.getElementById("edit-precious-price").value = "";
  document.getElementById("edit-precious-discount").value = "";
  document.getElementById("edit-precious-url").value = "";
  document.getElementById("edit-precious-picture-url").value = "";
  document.getElementById("edit-precious-discount").disabled = true;

  document.querySelectorAll('input[name="edit-statusRadio"]').forEach((radio) => {
    radio.checked = false;
    radio.removeAttribute("checked");
  });

  document.getElementById("edit-precious-type").selectedIndex = 0;
  document.getElementById("edit-precious-tag").selectedIndex = 0;
  document.getElementById("edit-rating-select").selectedIndex = 0;
}

function fetchAndRenderPreciousList() {
  return fetch("/api/preciouslist", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.success) {
        console.error("Failed to fetch precious list", data && data.message);
        return;
      }

      const formatted = formatPreciousListData(data.data || []);
      preciousListData = formatted;
      reRenderPreciousList(formatted);
    })
    .catch((err) => {
      console.error("Failed to fetch precious list", err);
    });
}

function renderPreciousList(data) {
  const container = document.getElementById("table-gridjs");
  container.innerHTML = "";

  const escapeHtmlAttr = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const renderTooltipLink = (value) => {
    const tooltipValue = String(value ?? "").trim() || "-";
    const safeTooltipValue = escapeHtmlAttr(tooltipValue);
    return gridjs.html(
      `<a
          href="javascript:void(0);"
          class="link-reset fs-20 p-1 text-infjew"
          data-bs-toggle="tooltip"
          data-bs-trigger="hover"
          data-bs-title="${safeTooltipValue}"
          title="${safeTooltipValue}"
        >
          <i class="ti ti-link"></i>
        </a>`
    );
  };

  const preciousGrid = new gridjs.Grid({
    columns: [
      { name: "ID", width: "50px" },
      { name: "ItemID", width: "200px" },
      { name: "Title", width: "250px" },
      { name: "Type", width: "120px" },
      {
        name: "Tag",
        width: "120px",
        formatter: (e) =>
          gridjs.html(`<span class="badge bg-infjew fs-12 p-1">${e}</span>`),
      },
      { name: "Price", width: "80px" },
      { name: "Discount", width: "80px" },
      { name: "Rating", width: "80px" },
      {
        name: "Status",
        width: "100px",
        formatter: (e) =>
          gridjs.html(
            e === 1
              ? '<span class="badge bg-success fs-12 p-1">Active</span>'
              : e === 0
                ? '<span class="badge bg-primary fs-12 p-1">Sold</span>'
                : e === 2
                  ? '<span class="badge bg-warning fs-12 p-1">Sale</span>'
                  : e === 3
                    ? '<span class="badge bg-danger fs-12 p-1">Unavailable</span>'
                    : '<span class="badge bg-secondary-subtle text-secondary fs-12 p-1">Unknown</span>'
          ),
      },
      {
        name: "Url",
        width: "50px",
        formatter: (e) => renderTooltipLink(e),
      },
      {
        name: "PicUrl",
        width: "50px",
        formatter: (e) => renderTooltipLink(e),
      },
      {
        name: "Action",
        width: "150px",
        formatter: (e) =>
          gridjs.html(
            `<div class="hstack gap-2">
              <a data-bs-toggle="modal" data-bs-target="#EditPreciousModal"
                 data-id="${e}"
                 class="btn btn-soft-primary btn-icon btn-sm rounded-circle table-edit-precious-btn">
                <i class="ti ti-edit fs-16"></i>
              </a>
              <a data-bs-toggle="modal" data-bs-target="#EditPreciousInfoModal"
                 data-id="${e}"
                 class="btn btn-soft-success btn-icon btn-sm rounded-circle table-edit-precious-info-btn">
                <i class="ti ti-id fs-16"></i>
              </a>
              <a href="javascript:void(0);"
                 class="btn btn-soft-danger btn-icon btn-sm rounded-circle sweet-delete-btn"
                 data-id="${e}">
                <i class="ti ti-trash"></i>
              </a>
            </div>`
          ),
      },
    ],
    pagination: { limit: 10 },
    sort: true,
    search: true,
    data: data,
  });

  const initTooltips = (scopeEl = container) => {
    if (!window.bootstrap || !window.bootstrap.Tooltip) {
      return;
    }

    scopeEl.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      bootstrap.Tooltip.getOrCreateInstance(el);
    });
  };

  preciousGrid.on("ready", () => {
    initTooltips(container);
  });

  preciousGrid.render(container);
  setTimeout(() => {
    initTooltips(container);
  }, 0);

  if (!container.dataset.tooltipDelegated) {
    container.addEventListener(
      "mouseenter",
      (event) => {
        const trigger = event.target.closest('[data-bs-toggle="tooltip"]');
        if (!trigger || !window.bootstrap || !window.bootstrap.Tooltip) {
          return;
        }
        bootstrap.Tooltip.getOrCreateInstance(trigger);
      },
      true
    );
    container.dataset.tooltipDelegated = "1";
  }
}

function reRenderPreciousList(data) {
  const container = document.getElementById("table-gridjs");
  container.classList.remove("fade-in");
  container.classList.add("fade-out");

  setTimeout(() => {
    renderPreciousList(data);
    container.classList.remove("fade-out");
    container.classList.add("fade-in");
  }, 300);
}

function addEventListenerAfterDOMLoaded() {
  Array.from(document.getElementsByClassName("form-check-input-add")).forEach((radio) => {
    radio.addEventListener("click", () => {
      if (document.getElementById("add-statusRadio2").checked) {
        document.getElementById("add-precious-discount").removeAttribute("disabled");
      } else {
        document.getElementById("add-precious-discount").setAttribute("disabled", "disabled");
      }
    });
  });

  Array.from(document.getElementsByClassName("form-check-input-edit")).forEach((radio) => {
    radio.addEventListener("click", () => {
      if (document.getElementById("edit-statusRadio2").checked) {
        document.getElementById("edit-precious-discount").removeAttribute("disabled");
      } else {
        document.getElementById("edit-precious-discount").setAttribute("disabled", "disabled");
      }
    });
  });

  document.getElementById("add-precious-btn").addEventListener("click", () => {
    const preciousData = {
      id: document.getElementById("add-precious-id").value.trim(),
      title: document.getElementById("add-precious-title").value.trim(),
      price: document.getElementById("add-precious-price").value.trim(),
      status:
        document.querySelector('input[name="add-statusRadio"]:checked')?.nextElementSibling.innerText.trim() || "",
      discount: parseFloat(document.getElementById("add-precious-discount").value) || 0,
      type: document.getElementById("add-precious-type").value.trim(),
      tag: document.getElementById("add-precious-tag").value.trim(),
      rating: parseFloat(document.getElementById("add-rating-select").value),
      url: document.getElementById("add-precious-url").value.trim(),
      picurl: document.getElementById("add-precious-picture-url").value.trim(),
    };

    const statusMapping = {
      Sold: 0,
      Active: 1,
      Sale: 2,
      Unavailable: 3,
    };

    const parsedPrice = Number.parseInt(preciousData.price, 10) || 0;
    const parsedDiscount = Number.parseInt(preciousData.discount, 10) || 0;
    const statusCode = statusMapping[preciousData.status];

    const dataToSend = {
      itemid: preciousData.id,
      title: preciousData.title,
      type: preciousData.type,
      tag: preciousData.tag,
      price: parsedPrice,
      status: statusCode,
      discount: statusCode === 2 ? parsedDiscount : parsedPrice,
      rating: preciousData.rating,
      url: preciousData.url,
      picurl: preciousData.picurl,
    };

    AddPreciousList(dataToSend);
  });

  document.getElementById("close-save-precious-btn").addEventListener("click", () => {
    clearPreciousForm();
  });

  document.getElementById("table-gridjs").addEventListener("click", (e) => {
    const editBtn = e.target.closest(".table-edit-precious-btn");
    if (!editBtn) {
      return;
    }

    const id = parseInt(editBtn.getAttribute("data-id"), 10);
    const result = preciousListData.find((row) => row[PRECIOUS_INDEX.ID] === id);
    fillEditForm(result);
  });

  document.getElementById("table-gridjs").addEventListener("click", (e) => {
    const infoBtn = e.target.closest(".table-edit-precious-info-btn");
    if (!infoBtn) {
      return;
    }

    const id = parseInt(infoBtn.getAttribute("data-id"), 10);
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    const result = preciousListData.find((row) => row[PRECIOUS_INDEX.ID] === id);
    fillPreciousInfoModalFromList(result);

    fetchPreciousInfoByPreciousID(id)
      .then((info) => {
        fillPreciousInfoModal(info);
      })
      .catch((err) => {
        console.error("Failed to fetch precious info", err);
      });
  });

  document.getElementById("save-precious-btn").addEventListener("click", () => {
    const editPreciousData = {
      id: document.getElementById("edit-precious-id").value.trim(),
      itemid: document.getElementById("edit-precious-itemid").value.trim(),
      title: document.getElementById("edit-precious-title").value.trim(),
      price: document.getElementById("edit-precious-price").value.trim(),
      status:
        document.querySelector('input[name="edit-statusRadio"]:checked')?.nextElementSibling.innerText.trim() || "",
      discount: parseFloat(document.getElementById("edit-precious-discount").value) || 0,
      type: document.getElementById("edit-precious-type").value.trim(),
      tag: document.getElementById("edit-precious-tag").value.trim(),
      rating: parseFloat(document.getElementById("edit-rating-select").value),
      url: document.getElementById("edit-precious-url").value.trim(),
      picurl: document.getElementById("edit-precious-picture-url").value.trim(),
    };

    const statusMapping = {
      Sold: 0,
      Active: 1,
      Sale: 2,
      Unavailable: 3,
    };

    const parsedPrice = Number.parseInt(editPreciousData.price, 10) || 0;
    const parsedDiscount = Number.parseInt(editPreciousData.discount, 10) || 0;
    const statusCode = statusMapping[editPreciousData.status];

    const dataToSend = {
      id: parseInt(editPreciousData.id, 10),
      itemid: editPreciousData.itemid,
      title: editPreciousData.title,
      type: editPreciousData.type,
      tag: editPreciousData.tag,
      price: parsedPrice,
      status: statusCode,
      discount: statusCode === 2 ? parsedDiscount : parsedPrice,
      rating: editPreciousData.rating,
      url: editPreciousData.url,
      picurl: editPreciousData.picurl,
    };

    UpdatePreciousList(dataToSend);
  });

  document.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".sweet-delete-btn");
    if (!deleteBtn) {
      return;
    }

    const id = parseInt(deleteBtn.dataset.id, 10);

    Swal.fire({
      title: "Are you sure?",
      text: "The data will be deleted",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: "swal2-confirm btn btn-primary",
        cancelButton: "btn btn-warning ms-2",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      fetch("/api/preciouslist/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            location.reload();
            return;
          }

          Swal.fire({
            title: "Delete Failed",
            text: data.message || "",
            icon: "error",
          });
        })
        .catch((err) => {
          console.error("Delete precious failed", err);
          Swal.fire({
            title: "Delete Failed",
            text: "Please try again.",
            icon: "error",
          });
        });
    });
  });
}

function formatPreciousListData(data) {
  return data.map((item) => [
    item.id,
    item.itemid,
    item.title,
    item.type,
    item.tag,
    item.price,
    item.discount,
    item.rating,
    item.status,
    item.url,
    item.picurl,
    item.id,
  ]);
}

function AddPreciousList(payload) {
  fetch("/api/preciouslist/create", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        location.reload();
        return;
      }
      console.error("Create precious failed", result.message);
    })
    .catch((error) => {
      console.error("Create precious failed", error);
    });
}

function UpdatePreciousList(payload) {
  fetch("/api/preciouslist/update", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        location.reload();
        return;
      }
      console.error("Update precious failed", result.message);
    })
    .catch((error) => {
      console.error("Update precious failed", error);
    });
}
