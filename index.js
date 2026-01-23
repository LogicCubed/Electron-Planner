

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

    function renderNotes(notesToRender = notes) {
        notesToRender = [...notesToRender].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

        notesContainer.innerHTML = "";

        notesToRender.forEach((note, index) => {
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
            notesContainer.appendChild(noteElement);
        });

        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                const id = parseInt(this.getAttribute("data-id"));
                const note = notes.find((n) => n.id === id);
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
        const classes = {
            important: "tag-important",
            homework: "tag-homework",
            coding: "tag-coding",
            modelling: "tag-modelling",
            misc: "tag-misc",
        };
        return classes[tag] || "";
    }

    function getTagIcon(tag) {
        const icons = {
            important: '<i class="fa-solid fa-circle-exclamation"></i>',
            homework: '<i class="fa-solid fa-book"></i>',
            coding: '<i class="fa-solid fa-terminal"></i>',
            modelling: '<i class="fa-solid fa-cube"></i>',
            misc: '<i class="fa-solid fa-dice"></i>',
        };
        return icons[tag] || "";
    }

    function getTagName(tag) {
        const names = {
            important: "Important",
            homework: "Homework",
            coding: "Coding",
            modelling: "Modelling",
            misc: "Misc",
        };
        return names[tag] || tag;
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
            const newNote = {
                id: Date.now(),
                title,
                content,
                tag,
                pinned: false,
                date: new Date().toISOString(),
            };
            notes.unshift(newNote);
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
            filteredNotes = filteredNotes.filter(
                (note) =>
                    note.title.toLowerCase().includes(searchTerm) ||
                    note.content.toLowerCase().includes(searchTerm)
            );
        }

        if (filterValue !== "all") {
            filteredNotes = filteredNotes.filter(
                (note) => note.tag === filterValue
            );
        }

        renderNotes(filteredNotes);
        updateEmptyState(filteredNotes);
    }

    function updateEmptyState(notesToCheck = notes) {
        if (notesToCheck.length === 0) {
            emptyState.style.display = "block";
        } else {
            emptyState.style.display = "none";
        }
    }
});