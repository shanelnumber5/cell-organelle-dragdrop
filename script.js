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

  // ---------- State ----------
  const state = {
    dropped: Object.create(null),
    organelles: [],
    targets: []
  };

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);

  function shuffle(arr) {
    // Fisher-Yates shuffle (in-place copy)
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getOrgNameById(id) {
    const found = state.organelles.find(o => o.id === id) || organellesBase.find(o => o.id === id);
    return found ? found.name : "";
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

  // ---------- Render ----------
  function renderOrganelles() {
    const organellesEl = $("organelles");
    if (!organellesEl) return;

    organellesEl.innerHTML = "";

    state.organelles.forEach(org => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.draggable = true;
      chip.dataset.id = org.id;

      chip.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", org.id);
        e.dataTransfer.effectAllowed = "move";
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

      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      row.addEventListener("drop", (e) => {
        e.preventDefault();
        const organelleId = e.dataTransfer.getData("text/plain");
        if (!organelleId) return;

        state.dropped[t.id] = organelleId;
        clearFeedback();
        renderTargets();
      });

      const label = document.createElement("div");
      label.textContent = t.label;

      const slot = document.createElement("div");
      slot.className = "dropSlot";

      const placedId = state.dropped[t.id];
      slot.textContent = placedId ? (getOrgNameById(placedId) || "Drop Here") : "Drop Here";

      row.appendChild(label);
      row.appendChild(slot);
      targetsEl.appendChild(row);
    });
  }

  // ---------- Actions ----------
  function checkAnswers() {
    let correct = 0;

    // Grade against the canonical IDs (order does not matter)
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
    state.organelles = shuffle(organellesBase);
    state.targets = shuffle(targetsBase);
    clearFeedback();
    renderOrganelles();
    renderTargets();
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    const checkBtn = $("checkBtn");
    const resetBtn = $("resetBtn");

    if (checkBtn) checkBtn.addEventListener("click", checkAnswers);
    if (resetBtn) resetBtn.addEventListener("click", startNewRound);

    startNewRound();
  });
})();
