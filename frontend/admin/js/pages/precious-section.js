window.bannerList = [];
window.countingDown = [];


window.addEventListener("DOMContentLoaded", function () {
  fetch("https:
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("Banner ", data.data);
        bannerList = data.data;
        renderBannerTable(bannerList);
        toggleAddBannerButton(bannerList);
      } else {
        console.log(" Banner :", data.message);
      }
    })
    .catch((error) => {
      console.error(":", error);
    });

  fetch("https:
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("CountingDown ", data.data);
        countingDown = data.data[0];
        renderCountingDownTable(countingDown);
      } else {
        console.log(" CountingDown :", data.message);
      }
    })
    .catch((error) => {
      console.error(":", error);
    });


  document.addEventListener("click", function (e) {

    if (e.target.closest(".banner-delete-trash")) {
      const target = e.target.closest(".banner-delete-trash");
      const bannerId = target.getAttribute("data-banner-id");


      const idContainer = document.getElementById("delete-banner-id");
      if (idContainer) {
        idContainer.innerHTML = bannerId;
      }
    }
  });

  document
    .getElementById("confirm-delete-banner-btn")
    .addEventListener("click", function () {
      const id = parseInt(
        document.getElementById("delete-banner-id").innerHTML.trim()
      );

      deleteBanner(id);
    });

  document.addEventListener("click", function (e) {
    const target = e.target;
    if (target && target.id === "add-banner-btn") {
      fetch("https:
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(getAddBannerForm()),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log(" Banner ");
            renderBannerTable(data.data);
            toggleAddBannerButton(data.data);


            const modal = bootstrap.Modal.getInstance(
              document.getElementById("AddBannerModal")
            );
            if (modal) modal.hide();
          } else {
            console.error(" : ", data.message);
          }
        })
        .catch((err) => {
          console.error(" : ", err);
        });
    }
  });
});

function getAddBannerForm() {
  const newBanner = {
    title1: document.getElementById("add-banner-title-1").value.trim(),
    title2: document.getElementById("add-banner-title-2").value.trim(),
    subtitle: document.getElementById("add-banner-subtitle").value.trim(),
    url: document.getElementById("add-banner-url").value.trim(),
    picurl: document.getElementById("add-banner-picture-url").value.trim(),
  };
  return newBanner;
}

function getCountingDownPreciousForm() {
  const priceValue = parseFloat(
    document.getElementById("edit-countingdown-price").value.trim()
  );
  const discountValue = parseFloat(
    document.getElementById("edit-countingdown-discount").value.trim()
  );

  let percentageValue = 0;
  if (priceValue && discountValue) {
    percentageValue = -Math.round(
      ((priceValue - discountValue) / priceValue) * 100
    );
  }
  const editCountingDownPreciousData = {
    title: document.getElementById("edit-countingdown-title").value.trim(),
    price: parseInt(
      document.getElementById("edit-countingdown-price").value.trim()
    ),
    discount: parseInt(
      document.getElementById("edit-countingdown-discount").value.trim()
    ),
    percentage: `${percentageValue}%`,
    rating: parseInt(
      document.getElementById("edit-countingdown-rating-select").value
    ),
    ddl: document.getElementById("edit-countingdown-ddl").value.trim(),
    url: document.getElementById("edit-countingdown-precious-url").value.trim(),
    picurl: document
      .getElementById("edit-countingdown-precious-picture-url")
      .value.trim(),
  };

  console.log("", editCountingDownPreciousData);
  return editCountingDownPreciousData;
}




























function renderCountingDownTable(data) {
  const tbody = document.getElementById("index-counting-down-tbody");


  tbody.innerHTML = "";

  const row = document.createElement("tr");

  row.innerHTML = `
    <td>
      <img
        src="${data.picurl}"
        alt="table-user"
        class="me-2 avatar-xl"
      />
    </td>
    <td>${data.title}</td>
    <td>$${data.price}</td>
    <td>$${data.discount}</td>
    <td>
      <span class="badge bg-infjew fs-12 p-1">${data.percentage}</span>
    </td>
    <td>${data.rating}</td>
    <td>${data.ddl}</td>
    <td class="text-muted">
      <a
        href="javascript:void(0);"
        class="link-reset fs-20 p-1 text-infjew"
        data-bs-toggle="tooltip"
        data-bs-trigger="hover"
        data-bs-title="${data.url}"
      >
        <i class="ti ti-link"></i>
      </a>
    </td>
    <td class="text-muted">
      <a
        href="javascript:void(0);"
        class="link-reset fs-20 p-1"
        data-bs-toggle="modal"
        data-bs-target="#EditCountingDownModal"
        id="countingdown-precious-edit-btn"
      >
        <i class="ti ti-pencil"></i>
      </a>
    </td>
  `;

  tbody.appendChild(row);


  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach(function (el) {
    new bootstrap.Tooltip(el);
  });

  document
    .getElementById("countingdown-precious-edit-btn")
    .addEventListener("click", function () {
      fillCountingDownModal(countingDown);
    });

  document.addEventListener("click", function (e) {
    const target = e.target;
    if (target && target.id === "save-countingdown-precious-btn") {
      const updatedData = getCountingDownPreciousForm();

      fetch("https:
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedData),
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.success) {
            console.log(" ");


            fetch("https:
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  countingDown = data.data[0];
                  renderCountingDownTable(countingDown);


                  const modal = bootstrap.Modal.getInstance(
                    document.getElementById("EditCountingDownModal")
                  );
                  if (modal) modal.hide();
                } else {
                  console.error(" :", data.message);
                }
              });
          } else {
            console.error(" :", res.message);
          }
        })
        .catch((err) => {
          console.error(" :", err);
        });
    }
  });
}

function fillCountingDownModal(data) {

  document.getElementById("edit-countingdown-title").value = data.title || "";
  document.getElementById("edit-countingdown-price").value = data.price || "";
  document.getElementById("edit-countingdown-discount").value =
    data.discount || "";
  document.getElementById("edit-countingdown-rating-select").value =
    data.rating || "1";
  document.getElementById("edit-countingdown-ddl").value = data.ddl || "";
  document.getElementById("edit-countingdown-precious-url").value =
    data.url || "";
  document.getElementById("edit-countingdown-precious-picture-url").value =
    data.picurl || "";
}

function renderBannerTable(data) {
  const tableBody = document.getElementById("index-banner-list-tbody");


  tableBody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <img
          src="${item.picurl}"
          alt="table-user"
          class="me-2 avatar-xl"
        />
      </td>
      <td>${item.id}</td>
      <td>${item.title1}</td>
      <td>${item.title2}</td>
      <td>${item.subtitle}</td>
      <td class="text-muted">
        <a
          href="javascript:void(0);"
          class="link-reset fs-20 p-1 text-infjew"
          data-bs-toggle="tooltip"
          data-bs-trigger="hover"
          data-bs-title="${item.url}"
        >
          <i class="ti ti-link"></i>
        </a>
      </td>
      <td class="text-muted">
        <a
          href="javascript:void(0);"
          class="link-reset fs-20 p-1 banner-delete-trash" data-banner-id="${item.id}"
          data-bs-toggle="modal"
        data-bs-target="#banner-delete-warning-modal"
          
        >
          <i class="ti ti-trash"></i>
        </a>
      </td>
    `;

    tableBody.appendChild(row);
  });


  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

function toggleAddBannerButton(data) {
  const addButton = document.getElementById("add-banner-modal-btn");
  const maxBannerCount = 3;

  if (data.length >= maxBannerCount) {
    addButton.classList.add("disabled");
    addButton.setAttribute("disabled", "disabled");
  } else {
    addButton.classList.remove("disabled");
    addButton.removeAttribute("disabled");
  }
}

function deleteBanner(bannerId) {
  fetch("https:
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bannerId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("Banner ");

        renderBannerTable(data.data);
        toggleAddBannerButton(data.data);
      } else {
        console.log("Banner :", data.message);
      }
    })
    .catch((error) => {
      console.error(":", error);
    });
}

