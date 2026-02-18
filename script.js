// script.js (desktop drag/drop + mobile tap-to-place)

(() => {
  "use strict";

  const organellesBase = [
    { id: "nucleus", name: "Nucleus", img: "images/nucleus.png" },
    { id: "mitochondria", name: "Mitochondria", img: "images/mitochondria.png" },
    { id: "golgi", name: "Golgi Apparatus", img: "images/golgi.png" },
    { id: "roughER", name: "Rough ER", img: "images/roughER.png" },
    { id: "smoothER", name: "Smooth ER", img: "images/smoothER.png" },
    { id: "ribosomes", name: "Ribosomes", img: "images/ribosomes.png" },
    { id: "lysosomes", name: "Lysosomes", img: "images/lysosomes.png" },
    { id: "membrane", name: "Plasma Membrane", img: "images/membrane.png" }
  ];

  const targetsBase = [
    { id: "nucleus", label: "Control Center (Contains DNA)" },
    { id: "mitochondria", label: "ATP / Energy Production" },
    { id: "golgi", label: "Modifies & Packages Proteins" },
    { id: "roughER", label: "Protein Synthesis (With Ribosomes)" },
    { id: "smoothER", label: "Lipid Synthesis & Detox" },
    { id: "ribosomes", label: "Build Proteins" },
    { id: "lysosomes", label: "Digest Waste & Pathogens" },
    { id: "membrane", label: "Controls Cell Entry/Exit" }
  ];

  const state = {
    dropped: Object.create(null),
    organelles: [],
    targets: [],
    selectedOrganelleId: null,
    isTouchMode: false
  };

  const $ = (id) => document.getElementById(id);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getOrgById(id) {
    return state.organelles.find(o => o.id === id) || organellesBase.find(o => o.id === id) || null;
  }

  function clearFeedback() {
    const scoreEl = $("score");
    if (scoreEl) scoreEl.textContent = "";
    document.querySelectorAll(".target").forEach(el => el.classList.remove("good", "bad"));
  }

  function safeConfetti() {
    if (typeof window.confetti === "function") {
      window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }

  function playSuccessSound() {
    const sound = $("successSound");
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  function showMoPopup(ms = 6000) {
    const popup = $("moPopup");
    if (!popup) return;
    popup.hidden = false;
    window.setTimeout(() => (popup.hidden = true), ms);
  }

  function updateTapHint() {
    const scoreEl = $("score");
    if (!scoreEl) return;

    if (!state.isTouchMode) return;

    if (!state.selectedOrganelleId) {
      scoreEl.textContent = "Tap an organelle, then tap its matching function.";
    } else {
      const org = getOrgById(state.selectedOrganelleId);
      scoreEl.textContent = `Selected: ${org ? org.name : "Organelle"} — now tap a function to place it.`;
    }
  }

  function renderOrganelles() {
    const organellesEl = $("organelles");
    if (!organellesEl) return;

    organellesEl.innerHTML = "";

    state.organelles.forEach(org => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.dataset.id = org.id;

      // Desktop drag
      chip.draggable = !state.isTouchMode;

      chip.addEventListener("dragstart", (e) => {
        if (state.isTouchMode) return;
        e.dataTransfer.setData("text/plain", org.id);
        e.dataTransfer.effectAllowed = "move";
      });

      // Mobile tap-to-select (also works on desktop if you tap)
      chip.addEventListener("click", () => {
        state.selectedOrganelleId = org.id;
        document.querySelectorAll(".chip").forEach(el => el.classList.remove("selected"));
        chip.classList.add("selected");
        clearFeedback();
        updateTapHint();
      });

      const img = document.createElement("img");
      img.className = "org-img";
      img.alt = org.name;
      img.src = org.img;
      img.addEventListener("error", () => (img.style.display = "none"));

      const label = document.createElement("div");
      label.textContent = org.name;

      chip.appendChild(img);
      chip.appendChild(label);
      organellesEl.appendChild(chip);
    });
  }

  function renderTargets() {
    const targetsEl = $("targets");
    if (!targetsEl) return;

    targetsEl.innerHTML = "";

    state.targets.forEach(t => {
      const row = document.createElement("div");
      row.className = "target";
      row.dataset.id = t.id;

      // Desktop drop
      row.addEventListener("dragover", (e) => {
        if (state.isTouchMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      row.addEventListener("drop", (e) => {
        if (state.isTouchMode) return;
        e.preventDefault();
        const organelleId = e.dataTransfer.getData("text/plain");
        if (!organelleId) return;

        state.dropped[t.id] = organelleId;
        clearFeedback();
        renderTargets();
      });

      // Mobile tap-to-place
      row.addEventListener("click", () => {
        if (!state.isTouchMode) return;
        if (!state.selectedOrganelleId) {
          updateTapHint();
          return;
        }

        state.dropped[t.id] = state.selectedOrganelleId;

        // clear selection after placing
        state.selectedOrganelleId = null;
        document.querySelectorAll(".chip").forEach(el => el.classList.remove("selected"));

        clearFeedback();
        renderTargets();
        updateTapHint();
      });

      const label = document.createElement("div");
      label.textContent = t.label;

      const slot = document.createElement("div");
      slot.className = "dropSlot";

      const placedId = state.dropped[t.id];
      slot.textContent = placedId ? (getOrgById(placedId)?.name || "Drop Here") : "Drop Here";

      row.appendChild(label);
      row.appendChild(slot);
      targetsEl.appendChild(row);
    });
  }

  function checkAnswers() {
    let correct = 0;

    targetsBase.forEach(t => {
      const placed = state.dropped[t.id];
      const row = document.querySelector(`.target[data-id="${t.id}"]`);
      if (!row) return;

      if (placed === t.id) {
        correct++;
        row.classList.add("good");
        row.classList.remove("bad");
      } else {
        row.classList.add("bad");
        row.classList.remove("good");
      }
    });

    const scoreEl = $("score");
    if (scoreEl) scoreEl.textContent = `Score: ${correct} / ${targetsBase.length}`;

    if (correct === targetsBase.length) {
      safeConfetti();
      playSuccessSound();
      showMoPopup(6000);
    }
  }

  function startNewRound() {
    state.dropped = Object.create(null);
    state.selectedOrganelleId = null;

    state.organelles = shuffle(organellesBase);
    state.targets = shuffle(targetsBase);

    clearFeedback();
    renderOrganelles();
    renderTargets();
    updateTapHint();
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Detect touch devices (simple + practical)
    state.isTouchMode =
      ("ontouchstart" in window) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    const checkBtn = $("checkBtn");
    const resetBtn = $("resetBtn");

    if (checkBtn) checkBtn.addEventListener("click", checkAnswers);
    if (resetBtn) resetBtn.addEventListener("click", startNewRound);

    startNewRound();
  });
})();
