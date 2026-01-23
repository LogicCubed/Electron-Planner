document.addEventListener("DOMContentLoaded", function () {
    const notesContainer = document.getElementById("notesContainer");
    const addNoteBtn = document.getElementById("addNoteBtn");
    const addNoteModal = document.getElementById("addNoteModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const noteForm = document.getElementById("noteForm");
    const searchInput = document.getElementById("searchInput");
    const filterSelect = document.getElementById("filterSelect");
    const emptyState = document.getElementById("emptyState");
    const confirmModal = document.getElementById("confirmModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const viewNoteModal = document.getElementById("viewNoteModal");
    const viewNoteTitle = document.getElementById("viewNoteTitle");
    const viewNoteContent = document.getElementById("viewNoteContent");
    const viewNoteTag = document.getElementById("viewNoteTag");
    const viewNoteDate = document.getElementById("viewNoteDate");
    const viewCloseBtn = document.getElementById("viewCloseBtn");
    const viewEditBtn = document.getElementById("viewEditBtn");

    let activeViewNoteId = null;

    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    let noteToDeleteId = null;

    renderNotes();
    updateEmptyState();

    addNoteBtn.addEventListener("click", openAddNoteModal);
    closeModalBtn.addEventListener("click", closeAddNoteModal);
    noteForm.addEventListener("submit", handleNoteSubmit);
    searchInput.addEventListener("input", filterNotes);
    filterSelect.addEventListener("change", filterNotes);
    cancelDeleteBtn.addEventListener("click", closeConfirmModal);
    confirmDeleteBtn.addEventListener("click", confirmDeleteNote);
    viewCloseBtn.addEventListener("click", closeViewModal);

    viewEditBtn.addEventListener("click", () => {
        const note = notes.find(n => n.id === activeViewNoteId);
        if (!note) return;

        closeViewModal();

        document.getElementById("noteTitle").value = note.title;
        document.getElementById("noteContent").value = note.content;
        document.querySelector(`input[name="noteTag"][value="${note.tag}"]`).checked = true;

        addNoteModal.dataset.editingId = note.id;
        openAddNoteModal();
    });

    document.getElementById("min-btn").addEventListener("click", () => {
        window.electronAPI.minimize();
    });

    document.getElementById("max-btn").addEventListener("click", () => {
        window.electronAPI.maximize();
    });

    document.getElementById("close-btn").addEventListener("click", () => {
        window.electronAPI.close();
    });

    function renderNotes(notesToRender = notes) {
        notesToRender = [...notesToRender].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

        notesContainer.innerHTML = "";

        notesToRender.forEach((note) => {
            const noteElement = document.createElement("div");
            noteElement.className = "note-card fade-in";

            if (note.pinned) noteElement.classList.add("pinned");

            noteElement.innerHTML = `
            <div class="note-content">
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <div class="note-actions">
                        <button class="edit-btn" data-id="${note.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="pin-btn" data-id="${note.id}">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                        <button class="delete-btn" data-id="${note.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="note-text">${note.content}</p>
                <div class="note-footer">
                    <span class="note-tag ${getTagClass(note.tag)}">
                        ${getTagIcon(note.tag)} ${getTagName(note.tag)}
                    </span>
                    <span class="note-date">${formatDate(note.date)}</span>
                </div>
            </div>`;

            noteElement.addEventListener("click", (e) => {
                if (e.target.closest("button")) return;
                openViewModal(note);
            });

            notesContainer.appendChild(noteElement);

            const noteTextEl = noteElement.querySelector(".note-text");
            if (noteTextEl.scrollHeight > noteTextEl.clientHeight) {
                noteTextEl.classList.add("overflowing");
            }
        });

        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                const id = parseInt(this.getAttribute("data-id"));
                const note = notes.find(n => n.id === id);
                if (!note) return;

                document.getElementById("noteTitle").value = note.title;
                document.getElementById("noteContent").value = note.content;
                document.querySelector(`input[name="noteTag"][value="${note.tag}"]`).checked = true;

                addNoteModal.dataset.editingId = id;
                openAddNoteModal();
            });
        });

        document.querySelectorAll(".pin-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                const id = parseInt(this.getAttribute("data-id"));
                const note = notes.find(n => n.id === id);
                if (note) note.pinned = !note.pinned;
                saveNotes();
                renderNotes();
            });
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                const id = parseInt(this.getAttribute("data-id"));
                noteToDeleteId = notes.findIndex(n => n.id === id);
                openConfirmModal();
            });
        });
    }

    function getTagClass(tag) {
        return {
            important: "tag-important",
            personal: "tag-personal",
            homework: "tag-homework",
            coding: "tag-coding",
            modelling: "tag-modelling",
            misc: "tag-misc",
        }[tag] || "";
    }

    function getTagIcon(tag) {
        return {
            important: '<i class="fa-solid fa-circle-exclamation"></i>',
            personal: '<i class="fa-solid fa-mug-saucer"></i>',
            homework: '<i class="fa-solid fa-book"></i>',
            coding: '<i class="fa-solid fa-terminal"></i>',
            modelling: '<i class="fa-solid fa-cube"></i>',
            misc: '<i class="fa-solid fa-dice"></i>',
        }[tag] || "";
    }

    function getTagName(tag) {
        return {
            important: "Important",
            personal: "Personal",
            homework: "Homework",
            coding: "Coding",
            modelling: "Modelling",
            misc: "Misc",
        }[tag] || tag;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function openAddNoteModal() {
        const modalTitle = addNoteModal.querySelector(".modal-title");
        modalTitle.textContent = addNoteModal.dataset.editingId ? "Edit Note" : "New Note";
        addNoteModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeAddNoteModal() {
        addNoteModal.classList.remove("active");
        document.body.style.overflow = "auto";
        noteForm.reset();
    }

    function openConfirmModal() {
        confirmModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeConfirmModal() {
        confirmModal.classList.remove("active");
        document.body.style.overflow = "auto";
        noteToDeleteId = null;
    }

    function handleNoteSubmit(e) {
        e.preventDefault();

        const title = document.getElementById("noteTitle").value;
        const content = document.getElementById("noteContent").value;
        const tag = document.querySelector('input[name="noteTag"]:checked').value;
        const editingId = addNoteModal.dataset.editingId;

        if (editingId) {
            const note = notes.find(n => n.id == editingId);
            if (note) {
                note.title = title;
                note.content = content;
                note.tag = tag;
                note.date = new Date().toISOString();
            }
            delete addNoteModal.dataset.editingId;
        } else {
            notes.unshift({
                id: Date.now(),
                title,
                content,
                tag,
                pinned: false,
                date: new Date().toISOString(),
            });
        }

        saveNotes();
        renderNotes();
        closeAddNoteModal();
        updateEmptyState();
        filterNotes();
    }

    function confirmDeleteNote() {
        if (noteToDeleteId !== null) {
            notes.splice(noteToDeleteId, 1);
            saveNotes();
            renderNotes();
            updateEmptyState();
            filterNotes();
            closeConfirmModal();
        }
    }

    function saveNotes() {
        localStorage.setItem("notes", JSON.stringify(notes));
    }

    function filterNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;

        let filteredNotes = notes;

        if (searchTerm) {
            filteredNotes = filteredNotes.filter(note =>
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm)
            );
        }

        if (filterValue !== "all") {
            filteredNotes = filteredNotes.filter(note => note.tag === filterValue);
        }

        renderNotes(filteredNotes);
        updateEmptyState(filteredNotes);
    }

    function updateEmptyState(notesToCheck = notes) {
        emptyState.style.display = notesToCheck.length === 0 ? "block" : "none";
    }

    function openViewModal(note) {
        activeViewNoteId = note.id;
        viewNoteTitle.textContent = note.title;
        viewNoteContent.textContent = note.content;
        viewNoteTag.className = `note-tag ${getTagClass(note.tag)}`;
        viewNoteTag.innerHTML = `${getTagIcon(note.tag)} ${getTagName(note.tag)}`;
        viewNoteDate.textContent = formatDate(note.date);

        requestAnimationFrame(() => {
            if (viewNoteContent.scrollHeight > viewNoteContent.clientHeight) {
                viewNoteContent.classList.add("has-gradient");
            } else {
                viewNoteContent.classList.remove("has-gradient");
            }
        });

        viewNoteModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeViewModal() {
        viewNoteContent.classList.remove("has-gradient");
        viewNoteModal.classList.remove("active");
        document.body.style.overflow = "auto";
        activeViewNoteId = null;
    }

    viewNoteModal.addEventListener("click", (e) => {
        if (e.target === viewNoteModal) closeViewModal();
    });
});