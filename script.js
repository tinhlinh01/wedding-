(() => {
  const SELECTORS = {
    loader: '#page-loader',
    loaderPetals: '.page-loader__petals',
    pagePetals: '.fx-petals',
    autoScrollButton: '.auto-scroll',
    audioButton: '.audio',
    calendar: '#wedding-calendar',
    countdown: '#wedding-countdown',
    revealItems: '.reveal, .reveal-image, .reveal-text'
  };

  const CLASS_NAMES = {
    hidden: 'is-hidden',
    visible: 'is-visible',
    paused: 'is-paused',
    active: 'active'
  };

  const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const pageStartTime = Date.now();
  const root = document.body;

  const config = {
    audioSrc: root.dataset.audioSrc || '',
    weddingDate: root.dataset.weddingDate || '2026-03-29T00:00:00',
    calendarMonth: parseInt(root.dataset.calendarMonth || '3', 10),
    calendarYear: parseInt(root.dataset.calendarYear || '2026', 10),
    calendarHighlightDay: parseInt(root.dataset.calendarHighlightDay || '29', 10),
    calendarWeekStart: root.dataset.calendarWeekStart || 'monday',
    autoScrollSpeed: parseFloat(root.dataset.autoScrollSpeed || '0.05'),
    loaderMinDuration: 2200,
    loaderFadeDuration: 600
  };

  const elements = {
    loader: document.querySelector(SELECTORS.loader),
    loaderPetals: document.querySelector(SELECTORS.loaderPetals),
    pagePetals: document.querySelector(SELECTORS.pagePetals),
    autoScrollButton: document.querySelector(SELECTORS.autoScrollButton),
    audioButton: document.querySelector(SELECTORS.audioButton),
    calendar: document.querySelector(SELECTORS.calendar)
  };

  const state = {
    audioAutoplayTried: false,
    interactionFallbackBound: false,
    isAutoScrolling: false,
    autoScrollFrameId: null,
    lastAnimationFrameTime: 0,
    resizeTimer: null,
    countdownTimerId: null,
    userGestureHandlers: []
  };

  const backgroundAudio = config.audioSrc ? new Audio(config.audioSrc) : null;

  if (backgroundAudio) {
    backgroundAudio.loop = true;
    backgroundAudio.preload = 'auto';
  }

  function isReducedMotionEnabled() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function debounce(callback, delay) {
    let timerId = null;

    return function debounced(...args) {
      clearTimeout(timerId);
      timerId = window.setTimeout(() => callback.apply(this, args), delay);
    };
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function setAudioButtonState(isPlaying) {
    if (!elements.audioButton) return;

    elements.audioButton.classList.toggle(CLASS_NAMES.active, isPlaying);
    elements.audioButton.setAttribute('aria-pressed', String(isPlaying));
  }

  function setAutoScrollButtonVisible(isVisible) {
    if (!elements.autoScrollButton) return;
    elements.autoScrollButton.style.display = isVisible ? 'flex' : 'none';
  }

  async function playBackgroundAudio() {
    if (!backgroundAudio) return false;

    try {
      await backgroundAudio.play();
      setAudioButtonState(true);
      return true;
    } catch {
      setAudioButtonState(false);
      return false;
    }
  }

  function pauseBackgroundAudio() {
    if (!backgroundAudio) return;
    backgroundAudio.pause();
    setAudioButtonState(false);
  }

  function clearUserGestureFallback() {
    state.userGestureHandlers.forEach(({ type, handler, options }) => {
      window.removeEventListener(type, handler, options);
    });

    state.userGestureHandlers = [];
    state.interactionFallbackBound = false;
  }

  function bindFirstInteractionAudioFallback() {
    if (!backgroundAudio || state.interactionFallbackBound) return;

    state.interactionFallbackBound = true;

    const tryPlayOnGesture = async () => {
      if (!backgroundAudio.paused) {
        clearUserGestureFallback();
        return;
      }

      const played = await playBackgroundAudio();
      if (played) {
        clearUserGestureFallback();
      }
    };

    const listeners = [
      { type: 'click', options: { passive: true, once: true } },
      { type: 'touchstart', options: { passive: true, once: true } },
      { type: 'keydown', options: { once: true } },
      { type: 'wheel', options: { passive: true, once: true } }
    ];

    listeners.forEach(({ type, options }) => {
      window.addEventListener(type, tryPlayOnGesture, options);
      state.userGestureHandlers.push({ type, handler: tryPlayOnGesture, options });
    });
  }

  async function ensureAudioPlayback() {
    if (!backgroundAudio || state.audioAutoplayTried) return;

    state.audioAutoplayTried = true;
    const played = await playBackgroundAudio();

    if (!played) {
      bindFirstInteractionAudioFallback();
    }
  }

  function getMaxScrollableTop() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function stopAutoScroll(showButton = true) {
    state.isAutoScrolling = false;

    if (state.autoScrollFrameId) {
      cancelAnimationFrame(state.autoScrollFrameId);
      state.autoScrollFrameId = null;
    }

    state.lastAnimationFrameTime = 0;
    setAutoScrollButtonVisible(showButton);
  }

  function autoScrollStep(timestamp) {
    if (!state.isAutoScrolling) return;

    if (!state.lastAnimationFrameTime) {
      state.lastAnimationFrameTime = timestamp;
    }

    const delta = timestamp - state.lastAnimationFrameTime;
    state.lastAnimationFrameTime = timestamp;

    const nextTop = window.scrollY + delta * config.autoScrollSpeed;
    const maxTop = getMaxScrollableTop();

    if (nextTop >= maxTop) {
      window.scrollTo({ top: maxTop, behavior: 'auto' });
      stopAutoScroll(true);
      return;
    }

    window.scrollTo({ top: nextTop, behavior: 'auto' });
    state.autoScrollFrameId = requestAnimationFrame(autoScrollStep);
  }

  async function startAutoScroll({ ensureAudio = false } = {}) {
    if (ensureAudio && backgroundAudio?.paused) {
      const played = await playBackgroundAudio();
      if (!played) {
        bindFirstInteractionAudioFallback();
      }
    }

    if (state.isAutoScrolling) return;

    state.isAutoScrolling = true;
    state.lastAnimationFrameTime = 0;
    setAutoScrollButtonVisible(false);
    state.autoScrollFrameId = requestAnimationFrame(autoScrollStep);
  }

  function handleManualInterruption() {
    if (!state.isAutoScrolling) return;
    stopAutoScroll(true);
  }

  function renderWeddingCalendar() {
    if (!elements.calendar) return;

    const firstDate = new Date(config.calendarYear, config.calendarMonth - 1, 1);
    const totalDays = new Date(config.calendarYear, config.calendarMonth, 0).getDate();
    const jsDay = firstDate.getDay();
    const firstDayIndex =
      config.calendarWeekStart === 'monday' ? (jsDay + 6) % 7 : jsDay;

    let calendarHtml = `
      <div class="calendar-month">${MONTH_NAMES[config.calendarMonth - 1]} ${config.calendarYear}</div>
      <div class="calendar-grid">
    `;

    for (let day = 0; day < firstDayIndex; day += 1) {
      calendarHtml += '<div class="calendar-day is-empty"></div>';
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const highlightClass = day === config.calendarHighlightDay ? 'is-highlight' : '';
      calendarHtml += `<div class="calendar-day ${highlightClass}">${day}</div>`;
    }

    const renderedCells = firstDayIndex + totalDays;
    const totalCells = 42;

    for (let cell = renderedCells; cell < totalCells; cell += 1) {
      calendarHtml += '<div class="calendar-day is-empty"></div>';
    }

    calendarHtml += '</div>';
    elements.calendar.innerHTML = calendarHtml;
  }

  function startCountdown() {
    const countdown = document.querySelector(SELECTORS.countdown);
    if (!countdown) return;

    const daysElement = countdown.querySelector('[data-type="days"]');
    const hoursElement = countdown.querySelector('[data-type="hours"]');
    const minutesElement = countdown.querySelector('[data-type="minutes"]');
    const secondsElement = countdown.querySelector('[data-type="seconds"]');

    if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;

    const targetDate = new Date(config.weddingDate);

    const updateCountdown = () => {
      const now = Date.now();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        daysElement.textContent = '0';
        hoursElement.textContent = '0';
        minutesElement.textContent = '0';
        secondsElement.textContent = '0';

        if (state.countdownTimerId) {
          clearInterval(state.countdownTimerId);
          state.countdownTimerId = null;
        }
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);

      daysElement.textContent = String(days);
      hoursElement.textContent = String(hours);
      minutesElement.textContent = String(minutes);
      secondsElement.textContent = String(seconds);
    };

    updateCountdown();
    state.countdownTimerId = window.setInterval(updateCountdown, 1000);
  }

  function createPetals(layerElement, options) {
    if (!layerElement || isReducedMotionEnabled()) return;

    const fragment = document.createDocumentFragment();
    const petalCount = window.innerWidth <= 576 ? options.mobileCount : options.desktopCount;

    layerElement.innerHTML = '';

    for (let index = 0; index < petalCount; index += 1) {
      const petal = document.createElement('span');
      const inner = document.createElement('i');

      petal.className = options.className;
      petal.appendChild(inner);

      const startX = randomBetween(-8, 100);
      const drift = randomBetween(-options.maxDrift, options.maxDrift);

      petal.style.setProperty('--size', `${randomBetween(options.minSize, options.maxSize).toFixed(2)}px`);
      petal.style.setProperty('--x-start', `${startX.toFixed(2)}vw`);
      petal.style.setProperty('--x-end', `${(startX + drift).toFixed(2)}vw`);
      petal.style.setProperty('--fall-duration', `${randomBetween(options.minFallDuration, options.maxFallDuration).toFixed(2)}s`);
      petal.style.setProperty('--flutter-duration', `${randomBetween(options.minFlutterDuration, options.maxFlutterDuration).toFixed(2)}s`);
      petal.style.setProperty('--fall-delay', `${randomBetween(-options.maxNegativeDelay, 0).toFixed(2)}s`);
      petal.style.setProperty('--rotate-end', `${randomBetween(120, 340).toFixed(2)}deg`);
      petal.style.setProperty('--opacity', randomBetween(options.minOpacity, options.maxOpacity).toFixed(2));

      fragment.appendChild(petal);
    }

    layerElement.appendChild(fragment);
  }

  function initPetalEffects() {
    createPetals(elements.pagePetals, {
      className: 'petal',
      mobileCount: 18,
      desktopCount: 30,
      minSize: 14,
      maxSize: 28,
      maxDrift: 16,
      minFallDuration: 9,
      maxFallDuration: 18,
      minFlutterDuration: 2.8,
      maxFlutterDuration: 5.6,
      maxNegativeDelay: 20,
      minOpacity: 0.38,
      maxOpacity: 0.9
    });

    createPetals(elements.loaderPetals, {
      className: 'loader-petal',
      mobileCount: 22,
      desktopCount: 34,
      minSize: 10,
      maxSize: 20,
      maxDrift: 18,
      minFallDuration: 7,
      maxFallDuration: 14,
      minFlutterDuration: 2.2,
      maxFlutterDuration: 4.8,
      maxNegativeDelay: 16,
      minOpacity: 0.45,
      maxOpacity: 0.95
    });
  }

  function updateAnimationPauseState() {
    elements.pagePetals?.classList.toggle(CLASS_NAMES.paused, document.hidden);
    elements.loaderPetals?.classList.toggle(CLASS_NAMES.paused, document.hidden);
  }

  function initRevealOnScroll() {
    const revealElements = document.querySelectorAll(SELECTORS.revealItems);
    if (!revealElements.length) return;

    if (isReducedMotionEnabled()) {
      revealElements.forEach((element) => element.classList.add(CLASS_NAMES.visible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add(CLASS_NAMES.visible);
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        root: null,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    revealElements.forEach((element) => observer.observe(element));
  }

  async function finishLoaderSequence() {
    await ensureAudioPlayback();
    setAutoScrollButtonVisible(false);
    startAutoScroll();
  }

  function initLoader() {
    if (!elements.loader) {
      finishLoaderSequence();
      return;
    }

    window.addEventListener('load', () => {
      const elapsed = Date.now() - pageStartTime;
      const delay = Math.max(0, config.loaderMinDuration - elapsed);

      window.setTimeout(() => {
        elements.loader?.classList.add(CLASS_NAMES.hidden);

        window.setTimeout(() => {
          elements.loader?.remove();
          finishLoaderSequence();
        }, config.loaderFadeDuration);
      }, delay);
    });
  }

  function bindEvents() {
    elements.audioButton?.addEventListener('click', async () => {
      if (!backgroundAudio) return;

      if (backgroundAudio.paused) {
        const played = await playBackgroundAudio();
        if (!played) bindFirstInteractionAudioFallback();
        return;
      }

      pauseBackgroundAudio();
    });

    elements.autoScrollButton?.addEventListener('click', async () => {
      await startAutoScroll({ ensureAudio: true });
    });

    window.addEventListener('wheel', handleManualInterruption, { passive: true });
    window.addEventListener('touchmove', handleManualInterruption, { passive: true });

    window.addEventListener('keydown', (event) => {
      const interruptKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'];
      if (interruptKeys.includes(event.code) || interruptKeys.includes(event.key)) {
        handleManualInterruption();
      }
    });

    let touchStartY = 0;

    window.addEventListener(
      'touchstart',
      (event) => {
        touchStartY = event.touches?.[0]?.clientY || 0;
      },
      { passive: true }
    );

    window.addEventListener(
      'touchend',
      (event) => {
        const touchEndY = event.changedTouches?.[0]?.clientY || 0;
        if (Math.abs(touchEndY - touchStartY) > 6) {
          handleManualInterruption();
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'resize',
      debounce(() => {
        initPetalEffects();
      }, 220)
    );

    document.addEventListener('visibilitychange', updateAnimationPauseState);
  }

  function init() {
    renderWeddingCalendar();
    startCountdown();
    initPetalEffects();
    initRevealOnScroll();
    updateAnimationPauseState();
    initLoader();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
