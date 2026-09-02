// Landing intro: scatter-to-arranged animation (Home page hero only)
(function () {
  const title = document.getElementById('heroTitle');
  if (!title) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Break the headline into per-word spans with a random scattered starting
  // position/rotation, each with its own settle delay, while preserving the <br>.
  function scrambleWords(el, baseDelay, step) {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    let wordIndex = 0;

    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = node.textContent.split(/(\s+)/);
        parts.forEach((part) => {
          if (part.trim() === '') {
            el.appendChild(document.createTextNode(part));
            return;
          }
          const span = document.createElement('span');
          span.className = 'reveal-word';
          span.textContent = part;
          if (!prefersReducedMotion) {
            const x = (Math.random() * 70 - 35).toFixed(1);
            const y = (Math.random() * 50 - 25).toFixed(1);
            const r = (Math.random() * 24 - 12).toFixed(1);
            span.style.setProperty('--x', x + 'px');
            span.style.setProperty('--y', y + 'px');
            span.style.setProperty('--r', r + 'deg');
            span.style.setProperty('--d', baseDelay + wordIndex * step + 'ms');
          }
          el.appendChild(span);
          wordIndex += 1;
        });
      } else {
        el.appendChild(node.cloneNode(true));
      }
    });
  }

  scrambleWords(title, 90, 45);

  // Double rAF so the browser paints the scattered state before we flip to settled.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('intro-ready');
    });
  });
})();

// Project filter (Projects page only)
(function () {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.full-project-grid .project-card');

  if (!buttons.length || !cards.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !show);
      });
    });
  });
})();

// Custom Audio Player (Projects page only)
(function () {
  const players = document.querySelectorAll('.audio-player');
  if (!players.length) return;

  players.forEach((player) => {
    const audio = player.querySelector('audio');
    const playBtn = player.querySelector('.audio-ctrl-btn');
    const playIcon = playBtn.querySelector('.icon-play');
    const pauseIcon = playBtn.querySelector('.icon-pause');
    const progressBar = player.querySelector('.audio-progress-bar');
    const progressContainer = player.querySelector('.audio-progress-container');
    const timeDisplay = player.querySelector('.audio-time');
    const songCard = player.closest('.song-card');

    // Helper to format seconds to MM:SS
    function formatTime(secs) {
      if (isNaN(secs) || !isFinite(secs)) return '00:00';
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    // Update progress bar & time text
    function updateProgress() {
      if (!audio.duration) return;
      const percentage = (audio.currentTime / audio.duration) * 100;
      progressBar.style.width = `${percentage}%`;
      timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }

    // Reset when track ends
    audio.addEventListener('ended', () => {
      player.classList.remove('playing');
      if (songCard) songCard.classList.remove('playing');
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      progressBar.style.width = '0%';
      audio.currentTime = 0;
      timeDisplay.textContent = `00:00 / ${formatTime(audio.duration)}`;
    });

    // Play/Pause click handler
    playBtn.addEventListener('click', () => {
      // Pause all other players
      players.forEach((p) => {
        if (p !== player) {
          const otherAudio = p.querySelector('audio');
          otherAudio.pause();
          p.classList.remove('playing');
          const otherCard = p.closest('.song-card');
          if (otherCard) otherCard.classList.remove('playing');
          p.querySelector('.icon-play').classList.remove('hidden');
          p.querySelector('.icon-pause').classList.add('hidden');
        }
      });

      if (audio.paused) {
        audio.play().then(() => {
          player.classList.add('playing');
          if (songCard) songCard.classList.add('playing');
          playIcon.classList.add('hidden');
          pauseIcon.classList.remove('hidden');
        }).catch(err => console.log('Audio playback failed: ', err));
      } else {
        audio.pause();
        player.classList.remove('playing');
        if (songCard) songCard.classList.remove('playing');
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    });

    // Click progress container to seek
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      if (audio.duration) {
        audio.currentTime = percentage * audio.duration;
        updateProgress();
      }
    });

    // Update periodically
    audio.addEventListener('timeupdate', updateProgress);

    // Initial time set when metadata is loaded
    audio.addEventListener('loadedmetadata', () => {
      timeDisplay.textContent = `00:00 / ${formatTime(audio.duration)}`;
    });

    // Fallback if metadata is already loaded or loads slower
    if (audio.readyState >= 1) {
      timeDisplay.textContent = `00:00 / ${formatTime(audio.duration)}`;
    } else {
      timeDisplay.textContent = '00:00 / 02:40';
    }
  });
})();

// Modal Overlay Controller
(function () {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const backdrop = modal.querySelector('.modal-backdrop');
  const closeBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalTag = document.getElementById('modalTag');
  const modalTitle = document.getElementById('modalTitle');
  const modalTools = document.getElementById('modalTools');
  const modalBody = document.getElementById('modalBody');
  const modalLinks = document.getElementById('modalLinks');

  function openModal(card) {
    const img = card.querySelector('.project-thumb img');
    const tag = card.querySelector('.project-tag');
    const title = card.querySelector('h3');
    const tools = card.querySelector('.project-tools');
    const details = card.querySelector('.project-details');
    const intro = card.querySelector('.project-body > p');
    const links = card.querySelector('.project-links');

    if (img && img.style.display !== 'none') {
      modalImg.src = img.src;
      modalImg.alt = img.alt || 'Project Preview';
      modalImg.style.display = 'block';
    } else {
      modalImg.style.display = 'none';
    }

    if (tag) modalTag.textContent = tag.textContent;
    if (title) modalTitle.textContent = title.textContent;
    if (tools) modalTools.textContent = tools.textContent;

    let bodyHTML = '';
    if (intro) bodyHTML += `<p>${intro.textContent}</p>`;
    if (details) bodyHTML += details.innerHTML;
    modalBody.innerHTML = bodyHTML;

    if (links) {
      modalLinks.innerHTML = links.innerHTML;
    } else {
      modalLinks.innerHTML = '';
    }

    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 250);
  }

  document.body.addEventListener('click', (e) => {
    // Ignore click if user clicked directly on an external button link or audio player
    if (e.target.closest('.project-btn') || e.target.closest('.audio-player') || e.target.closest('.lyrics-scroll') || e.target.closest('.project-links a')) {
      return;
    }
    const card = e.target.closest('.project-card');
    if (card && !card.classList.contains('song-card')) {
      openModal(card);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
})();
