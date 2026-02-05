const token = localStorage.getItem("token");

const loginLink = document.getElementById("login-link");
const editionBanner = document.getElementById("edition-banner");
const editButton = document.getElementById("btn-edit");

const gallery = document.querySelector(".gallery");
const filters = document.querySelector(".filters");

const modal = document.getElementById("modal");
const modalOverlay = document.querySelector(".modal-overlay");
const modalClose = document.querySelector(".modal-close");
const modalBack = document.querySelector(".modal-back");
const galleryPage = document.querySelector(".gallery-page");
const formPage = document.querySelector(".form-page");
const modalGallery = document.querySelector(".modal-gallery");
const btnAddPhoto = document.querySelector(".modal-btn-add");

const modalForm = document.getElementById("modal-form");
const fileInput = document.getElementById("file-input");
const preview = document.getElementById("preview");
const titleInput = document.getElementById("title-input");
const categoryInput = document.getElementById("category-input");
const submitButton = document.querySelector('#modal-form button.btn-validate');

const uploadPlaceholder = document.getElementById("upload-placeholder");

// MODE CONNECTÉ / VISITEUR //

if (token) {
    editionBanner.classList.remove("hidden");
    loginLink.textContent = "logout";
    loginLink.style.cursor = "pointer";

    loginLink.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.reload();
    });

    filters.classList.add("hidden");
    editButton.classList.remove("hidden");
} else {
    editionBanner.classList.add("hidden");
    editButton.classList.add("hidden");
    filters.classList.remove("hidden");

    loginLink.addEventListener("click", () => {
        window.location.href = "login.html";
    });
}

// API //

let works = [];
let categories = [];

async function getWorks() {
    const response = await fetch("http://localhost:5678/api/works");
    works = await response.json();
}

async function getCategories() {
    const response = await fetch("http://localhost:5678/api/categories");
    categories = await response.json();
}

// AFFICHAGE WORKS//

function createWorks(works) {
    gallery.innerHTML = "";
    works.forEach(work => {
        const figure = document.createElement("figure");
        const img = document.createElement("img");
        const figcaption = document.createElement("figcaption");

        img.src = work.imageUrl;
        img.alt = work.title;
        figcaption.textContent = work.title;

        figure.appendChild(img);
        figure.appendChild(figcaption);
        gallery.appendChild(figure);
    });
}

// FILTRES// 

function createFilter(category) {
    const button = document.createElement("button");
    button.textContent = category.name;

    if (category.id === 0) button.classList.add("active");

    button.addEventListener("click", () => {
        document.querySelectorAll(".filters button").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        if (category.id === 0) {
            createWorks(works);
            return;
        }

        const filteredWorks = works.filter(work => work.categoryId === category.id);
        createWorks(filteredWorks);
    });

    filters.appendChild(button);
}

function createFilters(categories) {
    createFilter({ id: 0, name: "Tous" });
    categories.forEach(category => createFilter(category));
}


// INIT//

async function init() {
    await getWorks();
    await getCategories();

    createWorks(works);

    if (!token) {
        createFilters(categories);
    }
}

init();

// MODAL// 

editButton.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
btnAddPhoto.addEventListener("click", showFormPage);
modalBack.addEventListener("click", showGalleryPage);

function openModal() {
    modal.classList.remove("hidden");
    showGalleryPage();
    fillModalGallery();
    fillCategorySelect();
}

function closeModal() {
    modal.classList.add("hidden");
}

function showGalleryPage() {
    galleryPage.classList.remove("hidden");
    formPage.classList.add("hidden");
    modalBack.classList.add("hidden");

    
    preview.classList.add("hidden");
    uploadPlaceholder.classList.remove("hidden");
    fileInput.value = "";
    titleInput.value = "";
    categoryInput.value = "";
    submitButton.disabled = true;
    submitButton.classList.remove("valid");
}

function showFormPage() {
    galleryPage.classList.add("hidden");
    formPage.classList.remove("hidden");
    modalBack.classList.remove("hidden");
}

// MODAL GALLERY//

function fillModalGallery() {
    modalGallery.innerHTML = "";

    works.forEach(work => {
        const figure = document.createElement("figure");

        const img = document.createElement("img");
        img.src = work.imageUrl;
        img.alt = work.title;

        const btnDelete = document.createElement("button");
        btnDelete.classList.add("delete-btn");
        btnDelete.dataset.id = work.id;

        const svgImg = document.createElement("img");
        svgImg.src = "./assets/icons/trash-can-solid.svg";
        svgImg.alt = "Supprimer";

        btnDelete.appendChild(svgImg);

        btnDelete.addEventListener("click", () => deleteWork(work.id));

        figure.appendChild(img);
        figure.appendChild(btnDelete);

        modalGallery.appendChild(figure);
    });
}

async function deleteWork(id) {
    await fetch(`http://localhost:5678/api/works/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    works = works.filter(work => work.id != id);
    createWorks(works);
    fillModalGallery();
}


// FORMULAIRE AJOUT PHOTO//

fileInput.addEventListener("change", () => {
 
    preview.src = URL.createObjectURL(fileInput.files[0]);
    preview.classList.remove("hidden");
    uploadPlaceholder.classList.add("hidden");
    allowSubmit();
});

function allowSubmit() {
    const isValidFileInput = fileInput.files.length > 0;
    const isValidTitleInput = titleInput.value.trim().length > 0;
    const isValidCategoryInput = categoryInput.value !== "";

    if (isValidFileInput && isValidTitleInput && isValidCategoryInput) {
        submitButton.disabled = false;
        submitButton.classList.add("valid");
    } else {
        submitButton.disabled = true;
        submitButton.classList.remove("valid");
    }
}

fileInput.addEventListener('input', allowSubmit);
titleInput.addEventListener('input', allowSubmit);
categoryInput.addEventListener('input', allowSubmit);

// Soumission formulaire//

modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("image", fileInput.files[0]);
    formData.append("title", titleInput.value);
    formData.append("category", categoryInput.value);

    const response = await fetch("http://localhost:5678/api/works", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    const newWork = await response.json();
    works.push(newWork);

    createWorks(works);
    fillModalGallery();
    showGalleryPage();
});


// CATÉGORIES SELECT// 

function fillCategorySelect() {
    categoryInput.innerHTML = "";

    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "";
    optDefault.selected = true;
    optDefault.disabled = true;
    categoryInput.appendChild(optDefault);

    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        categoryInput.appendChild(opt);
    });
}