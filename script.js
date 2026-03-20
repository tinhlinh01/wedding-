document.addEventListener("DOMContentLoaded", function () {
const loaderStart = Date.now();
let hasTriedAutoplay = false;
let firstInteractionBound = false;

function bindFirstInteractionAudioFallback() {
  if (firstInteractionBound) return;
  firstInteractionBound = true;

  const tryPlayOnFirstGesture = async function () {
    if (!bgAudio.paused) return;
    await playBackgroundAudio();
    removeFallbackListeners();
  };

  function removeFallbackListeners() {
    window.removeEventListener('click', tryPlayOnFirstGesture);
    window.removeEventListener('touchstart', tryPlayOnFirstGesture);
    window.removeEventListener('keydown', tryPlayOnFirstGesture);
    window.removeEventListener('wheel', tryPlayOnFirstGesture);
  }

  window.addEventListener('click', tryPlayOnFirstGesture, { passive: true, once: true });
  window.addEventListener('touchstart', tryPlayOnFirstGesture, { passive: true, once: true });
  window.addEventListener('keydown', tryPlayOnFirstGesture, { once: true });
  window.addEventListener('wheel', tryPlayOnFirstGesture, { passive: true, once: true });
}

async function runAfterLoaderFinished() {
  if (!hasTriedAutoplay) {
    hasTriedAutoplay = true;
    const played = await playBackgroundAudio();

    if (!played) {
      bindFirstInteractionAudioFallback();
    }
  }

  setAutoScrollButtonVisible(false);
  startAutoScroll();
}

window.addEventListener("load", function () {
  const loader = document.getElementById("page-loader");
  if (!loader) {
    runAfterLoaderFinished();
    return;
  }

  const minDuration = 2200;
  const elapsed = Date.now() - loaderStart;
  const delay = Math.max(0, minDuration - elapsed);

  setTimeout(function () {
    loader.classList.add("is-hidden");

    setTimeout(function () {
      loader.remove();
      runAfterLoaderFinished();
    }, 500);
  }, delay);
});
  function initRevealOnScroll() {
  const elements = document.querySelectorAll(
    ".reveal, .reveal-image, .reveal-text"
  );

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target); // chỉ animate 1 lần
      });
    },
    {
      threshold: 0.18,
      root: null,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  elements.forEach((el) => observer.observe(el));
}
  function renderWeddingCalendar({
    elementId,
    month,
    year,
    highlightDay = null,
    weekStartsOn = "sunday" // sunday | monday
  }) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) return;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const firstDate = new Date(year, month - 1, 1);
    const totalDays = new Date(year, month, 0).getDate();

    const jsDay = firstDate.getDay(); // 0=Sun ... 6=Sat
    const firstDayIndex = weekStartsOn === "monday"
      ? (jsDay + 6) % 7
      : jsDay;

    let html = `
      <div class="calendar-month">${monthNames[month - 1]} ${year}</div>
      <div class="calendar-grid">
    `;

    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="calendar-day is-empty"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
      const isHighlight = day === highlightDay ? "is-highlight" : "";
      html += `<div class="calendar-day ${isHighlight}">${day}</div>`;
    }

    const renderedCells = firstDayIndex + totalDays;
    const totalCells = 42;

    for (let i = renderedCells; i < totalCells; i++) {
      html += `<div class="calendar-day is-empty"></div>`;
    }

    html += `</div>`;
    calendarEl.innerHTML = html;
  }

  renderWeddingCalendar({
    elementId: "wedding-calendar",
    month: 3,
    year: 2026,
    highlightDay: 29,
    weekStartsOn: "monday"
  });

  function startCountdown(targetDate) {
    const daysEl = document.querySelector('[data-type="days"]');
    const hoursEl = document.querySelector('[data-type="hours"]');
    const minutesEl = document.querySelector('[data-type="minutes"]');
    const secondsEl = document.querySelector('[data-type="seconds"]');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    let timer = null;

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        daysEl.textContent = "0";
        hoursEl.textContent = "0";
        minutesEl.textContent = "0";
        secondsEl.textContent = "0";
        if (timer) clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);

      daysEl.textContent = days;
      hoursEl.textContent = hours;
      minutesEl.textContent = minutes;
      secondsEl.textContent = seconds;
    }

    updateCountdown();
    timer = setInterval(updateCountdown, 1000);
  }

  startCountdown(new Date("2026-03-29T00:00:00"));

  const autoScrollBtn = document.querySelector('.auto-scroll');
  const audioBtn = document.querySelector('.audio');

  const bgAudio = new Audio('https://assets.cinelove.me/mp3/744fac10-6555-48a7-b265-715d7684a943.mp3');
  bgAudio.loop = true;
  bgAudio.preload = 'auto';

  let isAutoScrolling = false;
  let autoScrollRaf = null;
  let lastFrameTime = 0;
  let scrollSpeed = 0.05; // px/ms ~ 21px/s
  let manualStopTimeout = null;

  function setAutoScrollButtonVisible(visible) {
    if (!autoScrollBtn) return;
    autoScrollBtn.style.display = visible ? 'flex' : 'none';
  }

  function setAudioButtonState(isPlaying) {
    if (!audioBtn) return;
    audioBtn.classList.toggle('active', isPlaying);
  }

  async function playBackgroundAudio() {
    try {
      await bgAudio.play();
      setAudioButtonState(true);
      return true;
    } catch (error) {
      setAudioButtonState(false);
      return false;
    }
  }

  function pauseBackgroundAudio() {
    bgAudio.pause();
    setAudioButtonState(false);
  }

  function bindFirstInteractionAudioFallback() {
    if (firstInteractionBound) return;
    firstInteractionBound = true;

    const tryPlayOnFirstGesture = async function () {
      if (!bgAudio.paused) return;

      const played = await playBackgroundAudio();

      if (played) {
        removeFallbackListeners();
      }
    };

    function removeFallbackListeners() {
      window.removeEventListener('click', tryPlayOnFirstGesture);
      window.removeEventListener('touchstart', tryPlayOnFirstGesture);
      window.removeEventListener('keydown', tryPlayOnFirstGesture);
      window.removeEventListener('wheel', tryPlayOnFirstGesture);
    }

    window.addEventListener('click', tryPlayOnFirstGesture, { passive: true, once: true });
    window.addEventListener('touchstart', tryPlayOnFirstGesture, { passive: true, once: true });
    window.addEventListener('keydown', tryPlayOnFirstGesture, { once: true });
    window.addEventListener('wheel', tryPlayOnFirstGesture, { passive: true, once: true });
  }

  async function runAfterLoaderFinished() {
    if (!hasTriedAutoplay) {
      hasTriedAutoplay = true;
      const played = await playBackgroundAudio();

      if (!played) {
        bindFirstInteractionAudioFallback();
      }
    }

    setAutoScrollButtonVisible(false);
    startAutoScroll();
  }

  window.addEventListener("load", function () {
    const loader = document.getElementById("page-loader");

    if (!loader) {
      runAfterLoaderFinished();
      return;
    }

    const minDuration = 2200;
    const elapsed = Date.now() - loaderStart;
    const delay = Math.max(0, minDuration - elapsed);

    setTimeout(function () {
      loader.classList.add("is-hidden");

      setTimeout(function () {
        loader.remove();
        runAfterLoaderFinished();
      }, 600);
    }, delay);
  });

  function getMaxScrollableTop() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function stopAutoScroll(showButton = true) {
    isAutoScrolling = false;

    if (autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }

    lastFrameTime = 0;
    setAutoScrollButtonVisible(showButton);
  }

  function autoScrollStep(timestamp) {
    if (!isAutoScrolling) return;

    if (!lastFrameTime) {
      lastFrameTime = timestamp;
    }

    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    const nextTop = window.scrollY + (delta * scrollSpeed);
    const maxTop = getMaxScrollableTop();

    if (nextTop >= maxTop) {
      window.scrollTo({ top: maxTop, behavior: 'auto' });
      stopAutoScroll(true);
      return;
    }

    window.scrollTo({ top: nextTop, behavior: 'auto' });
    autoScrollRaf = requestAnimationFrame(autoScrollStep);
  }

async function startAutoScroll({ ensureAudio = false } = {}) {
  if (ensureAudio && bgAudio.paused) {
    const played = await playBackgroundAudio();
    if (!played) {
      bindFirstInteractionAudioFallback();
    }
  }

  if (isAutoScrolling) return;

  isAutoScrolling = true;
  lastFrameTime = 0;
  setAutoScrollButtonVisible(false);
  autoScrollRaf = requestAnimationFrame(autoScrollStep);
}

  function handleManualInterruption() {
    if (!isAutoScrolling) return;

    stopAutoScroll(true);

    if (manualStopTimeout) {
      clearTimeout(manualStopTimeout);
    }

    manualStopTimeout = setTimeout(() => {
      manualStopTimeout = null;
    }, 150);
  }

if (audioBtn) {
  audioBtn.addEventListener('click', async function () {
    if (bgAudio.paused) {
      const played = await playBackgroundAudio();
      if (!played) {
        bindFirstInteractionAudioFallback();
      }
    } else {
      pauseBackgroundAudio();
    }
  });
}

  if (autoScrollBtn) {
    autoScrollBtn.addEventListener('click', async function () {
      await startAutoScroll({ ensureAudio: true });
    });
  }

  window.addEventListener('wheel', handleManualInterruption, { passive: true });
  window.addEventListener('touchmove', handleManualInterruption, { passive: true });
  window.addEventListener('keydown', function (event) {
    const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'];
    if (keys.includes(event.code) || keys.includes(event.key)) {
      handleManualInterruption();
    }
  });

  let touchStartY = 0;
  window.addEventListener('touchstart', function (event) {
    touchStartY = event.touches && event.touches.length ? event.touches[0].clientY : 0;
  }, { passive: true });
  window.addEventListener('touchend', function (event) {
    const touchEndY = event.changedTouches && event.changedTouches.length ? event.changedTouches[0].clientY : 0;
    if (Math.abs(touchEndY - touchStartY) > 6) {
      handleManualInterruption();
    }
  }, { passive: true });
    function randomRange(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
  }

  function initPetalBackground() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const petalLayer = document.querySelector('.fx-petals');

    if (!petalLayer || prefersReducedMotion) return;

    const petalCount = window.innerWidth <= 576 ? 18 : 30;
    const fragment = document.createDocumentFragment();

    petalLayer.innerHTML = '';

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('span');
      const inner = document.createElement('i');

      petal.className = 'petal';
      petal.appendChild(inner);

      const size = randomRange(14, 28);
      const startX = randomRange(-8, 100);
      const drift = randomRange(-16, 16);
      const fallDuration = randomRange(9, 18);
      const flutterDuration = randomRange(2.8, 5.6);
      const fallDelay = randomRange(-20, 0);
      const rotateEnd = randomRange(120, 340);
      const opacity = randomRange(0.38, 0.9);

      petal.style.setProperty('--size', `${size}px`);
      petal.style.setProperty('--x-start', `${startX}vw`);
      petal.style.setProperty('--x-end', `${parseFloat(startX) + parseFloat(drift)}vw`);
      petal.style.setProperty('--fall-duration', `${fallDuration}s`);
      petal.style.setProperty('--flutter-duration', `${flutterDuration}s`);
      petal.style.setProperty('--fall-delay', `${fallDelay}s`);
      petal.style.setProperty('--rotate-end', `${rotateEnd}deg`);
      petal.style.setProperty('--opacity', opacity);

      fragment.appendChild(petal);
    }

    petalLayer.appendChild(fragment);
  }

  function initLoaderPetals() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loaderPetalLayer = document.querySelector('.page-loader__petals');

    if (!loaderPetalLayer || prefersReducedMotion) return;

    const petalCount = window.innerWidth <= 576 ? 22 : 34;
    const fragment = document.createDocumentFragment();

    loaderPetalLayer.innerHTML = '';

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('span');
      const inner = document.createElement('i');

      petal.className = 'loader-petal';
      petal.appendChild(inner);

      const size = randomRange(10, 20);
      const startX = randomRange(-8, 100);
      const drift = randomRange(-18, 18);
      const fallDuration = randomRange(7, 14);
      const flutterDuration = randomRange(2.2, 4.8);
      const fallDelay = randomRange(-16, 0);
      const rotateEnd = randomRange(120, 340);
      const opacity = randomRange(0.45, 0.95);

      petal.style.setProperty('--size', `${size}px`);
      petal.style.setProperty('--x-start', `${startX}vw`);
      petal.style.setProperty('--x-end', `${parseFloat(startX) + parseFloat(drift)}vw`);
      petal.style.setProperty('--fall-duration', `${fallDuration}s`);
      petal.style.setProperty('--flutter-duration', `${flutterDuration}s`);
      petal.style.setProperty('--fall-delay', `${fallDelay}s`);
      petal.style.setProperty('--rotate-end', `${rotateEnd}deg`);
      petal.style.setProperty('--opacity', opacity);

      fragment.appendChild(petal);
    }

    loaderPetalLayer.appendChild(fragment);
  }

  function pauseLoaderPetalsWhenHidden() {
    const loaderPetalLayer = document.querySelector('.page-loader__petals');

    if (!loaderPetalLayer) return;

    loaderPetalLayer.classList.toggle('is-paused', document.hidden);
  }

  let petalResizeTimer = null;

  initPetalBackground();
  initLoaderPetals();

  window.addEventListener('resize', function () {
    clearTimeout(petalResizeTimer);
    petalResizeTimer = setTimeout(function () {
      initPetalBackground();
      initLoaderPetals();
    }, 220);
  });

  document.addEventListener('visibilitychange', function () {
    const petalLayer = document.querySelector('.fx-petals');

    if (petalLayer) {
      petalLayer.classList.toggle('is-paused', document.hidden);
    }

    pauseLoaderPetalsWhenHidden();
  });

  initRevealOnScroll();
});
