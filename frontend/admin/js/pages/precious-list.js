window.preciousListData = [];

window.addEventListener("DOMContentLoaded", function () {
  fetchAndRenderPreciousList().then(() => {
    addEventListenerAfterDOMLoaded();
  });
});

function fillEditForm(result) {

  if (!result || result.length < 10) return;


  document.getElementById("edit-precious-id").value = result[0];
  document.getElementById("edit-precious-itemid").value = result[1];
  document.getElementById("edit-precious-title").value = result[2];
  document.getElementById("edit-precious-price").value = result[4];


  const statusRadioId = `edit-statusRadio${result[7]}`;
  const radio = document.getElementById(statusRadioId);
  if (radio) {
    radio.checked = true;
    radio.setAttribute("checked", "checked");
  }


  const discountInput = document.getElementById("edit-precious-discount");
  if (result[7] === 2) {

    discountInput.disabled = false;
    discountInput.value = result[5] !== "-" ? result[5] : "";
  } else {
    discountInput.disabled = true;
    discountInput.value = "";
  }


  const tagSelect = document.getElementById("edit-precious-tag");
  tagSelect.value = result[3];


  const ratingSelect = document.getElementById("edit-rating-select");
  for (let i = 0; i < ratingSelect.options.length; i++) {
    if (parseInt(ratingSelect.options[i].value) === result[6]) {
      ratingSelect.selectedIndex = i;
      break;
    }
  }

  document.getElementById("edit-precious-url").value = result[8];

  document.getElementById("edit-precious-picture-url").value = result[9];
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


  document.querySelectorAll('input[name="statusRadio"]').forEach((radio) => {
    radio.checked = false;
    radio.removeAttribute("checked");
  });


  document.getElementById("edit-precious-tag").selectedIndex = 0;
  document.getElementById("edit-rating-select").selectedIndex = 0;
}

function fetchAndRenderPreciousList() {
  return fetch("https:
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        console.error(" ", data.message);
        return;
      }


      const formatted = formatPreciousListData(data.data);
      preciousListData = formatted;


      reRenderPreciousList(formatted);
    });
}

function renderPreciousList(data) {
  const container = document.getElementById("table-gridjs");
  container.innerHTML = "";

  const preciousGrid = new gridjs.Grid({
    columns: [
      { name: "ID", width: "50px" },
      { name: "ItemID", width: "200px" },
      { name: "Title", width: "250px" },
      { name: "Tag", width: "120px" },
      { name: "Price", width: "50px" },
      { name: "Discount", width: "50px" },
      { name: "Rating", width: "50px" },
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
        formatter: (e) =>
          gridjs.html(
            `<a class="link-reset fs-20 p-1 text-infjew"
                data-bs-toggle="tooltip" 
                data-bs-trigger="hover" 
                data-bs-title="${e}">
                <i class="ti ti-link"></i></a>`
          ),
      },
      {
        name: "PicUrl",
        width: "50px",
        formatter: (e) =>
          gridjs.html(
            `<a class="link-reset fs-20 p-1 text-info"
                data-bs-toggle="tooltip" 
                data-bs-trigger="hover" 
                data-bs-title="${e}">
                <i class="ti ti-link"></i></a>`
          ),
      },
      {
        name: "Action",
        width: "100px",
        formatter: (e) =>
          gridjs.html(
            `<div class="hstack gap-2">
              <a data-bs-toggle="modal" data-bs-target="#EditPreciousModal" 
                 data-id="${e}" 
                 class="btn btn-soft-success btn-icon btn-sm rounded-circle table-edit-precious-btn">
                <i class="ti ti-edit fs-16"></i>
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

  preciousGrid.on("ready", () => {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.forEach(function (el) {
      new bootstrap.Tooltip(el);
    });
  });

  preciousGrid.render(container);
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
  Array.from(document.getElementsByClassName("form-check-input-add")).forEach(
    function (radio) {
      radio.addEventListener("click", function () {
        if (document.getElementById("add-statusRadio2").checked) {
          document
            .getElementById("add-precious-discount")
            .removeAttribute("disabled");
        } else {
          document
            .getElementById("add-precious-discount")
            .setAttribute("disabled", "disabled");
        }
      });
    }
  );
  Array.from(document.getElementsByClassName("form-check-input-edit")).forEach(
    function (radio) {
      radio.addEventListener("click", function () {
        if (document.getElementById("edit-statusRadio2").checked) {
          document
            .getElementById("edit-precious-discount")
            .removeAttribute("disabled");
        } else {
          document
            .getElementById("edit-precious-discount")
            .setAttribute("disabled", "disabled");
        }
      });
    }
  );

  document
    .getElementById("add-precious-btn")
    .addEventListener("click", function () {
      const preciousData = {
        id: document.getElementById("add-precious-id").value.trim(),
        title: document.getElementById("add-precious-title").value.trim(),
        price: document.getElementById("add-precious-price").value.trim(),
        status:
          document
            .querySelector('input[name="add-statusRadio"]:checked')
            ?.nextElementSibling.innerText.trim() || "",
        discount:
          parseFloat(document.getElementById("add-precious-discount").value) ||
          0,
        tag: document.getElementById("add-precious-tag").value,
        rating: parseInt(document.getElementById("add-rating-select").value),
        url: document.getElementById("add-precious-url").value.trim(),
        picurl: document
          .getElementById("add-precious-picture-url")
          .value.trim(),
      };

      const statusMapping = {
        Sold: 0,
        Active: 1,
        Sale: 2,
        Unavailable: 3,
      };

      const dataToSend = {
        itemid: preciousData.id,
        title: preciousData.title,
        price: parseInt(preciousData.price),
        status: statusMapping[preciousData.status],
        discount:
          statusMapping[preciousData.status] === 2
            ? parseInt(preciousData.discount)
            : parseInt(preciousData.price),
        tag: preciousData.tag,
        rating: preciousData.rating,
        url: preciousData.url,
        picurl: preciousData.picurl,
      };

      AddPreciousList(dataToSend);
    });

  document
    .getElementById("close-save-precious-btn")
    .addEventListener("click", function () {
      clearPreciousForm();
    });

  document
    .getElementById("table-gridjs")
    .addEventListener("click", function (e) {
      const editBtn = e.target.closest(".table-edit-precious-btn");

      if (editBtn) {
        const id = parseInt(editBtn.getAttribute("data-id"), 10);
        const result = preciousListData.find((row) => row[0] === id);

        console.log("", result, preciousListData);

        fillEditForm(result);
      }
    });

  document
    .getElementById("save-precious-btn")
    .addEventListener("click", function () {
      const editPreciousData = {
        id: document.getElementById("edit-precious-id").value.trim(),
        itemid: document.getElementById("edit-precious-itemid").value.trim(),
        title: document.getElementById("edit-precious-title").value.trim(),
        price: document.getElementById("edit-precious-price").value.trim(),
        status:
          document
            .querySelector('input[name="edit-statusRadio"]:checked')
            ?.nextElementSibling.innerText.trim() || "",
        discount:
          parseFloat(document.getElementById("edit-precious-discount").value) ||
          0,
        tag: document.getElementById("edit-precious-tag").value,
        rating: parseInt(document.getElementById("edit-rating-select").value),
        url: document.getElementById("edit-precious-url").value.trim(),
        picurl: document
          .getElementById("edit-precious-picture-url")
          .value.trim(),
      };

      const statusMapping = {
        Sold: 0,
        Active: 1,
        Sale: 2,
        Unavailable: 3,
      };

      const dataToSend = {
        id: parseInt(editPreciousData.id),
        itemid: editPreciousData.itemid,
        title: editPreciousData.title,
        price: parseInt(editPreciousData.price),
        status: statusMapping[editPreciousData.status],
        discount:
          statusMapping[editPreciousData.status] === 2
            ? parseInt(editPreciousData.discount)
            : parseInt(editPreciousData.price),
        tag: editPreciousData.tag,
        rating: editPreciousData.rating,
        url: editPreciousData.url,
        picurl: editPreciousData.picurl,
      };

      UpdatePreciousList(dataToSend);
    });

  document.addEventListener("click", function (e) {
    const deleteBtn = e.target.closest(".sweet-delete-btn");
    if (!deleteBtn) return;

    const id = parseInt(deleteBtn.dataset.id);

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
      if (result.isConfirmed) {
        fetch("https:
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: id }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              location.reload();
            } else {
              Swal.fire({
                title: " ",
                text: data.message || "",
                icon: "error",
              });
            }
          })
          .catch((err) => {
            console.error(" ", err);
            Swal.fire({
              title: "",
              text: "",
              icon: "error",
            });
          });
      }
    });
  });
}

function formatPreciousListData(data) {
  return data.map((item) => [
    item.id,
    item.itemid,
    item.title,
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

function AddPreciousList(e) {

  fetch("https:
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(e),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        console.log("", result);
        location.reload();
      } else {
        console.error("", result.message);
      }
    })
    .catch((error) => {
      console.error("", error);
    });
}

function UpdatePreciousList(e) {
  fetch(`https:
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(e),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        console.log("", result);
        location.reload();
      } else {
        console.error("", result.message);
      }
    })
    .catch((error) => {
      console.error("", error);
    });
}

