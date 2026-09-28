const quranData = [
  {
    title: 'Read the Qur’an',
    topic: 'Full Qur’an',
    description: 'Read the complete Qur’an with translations and recitation options on Quran.com.',
    reference: 'Quran.com',
    url: 'https://quran.com/',
    action: 'Open Qur’an',
  },
  {
    title: 'Al-Fatihah',
    topic: 'Surah 1',
    description: 'Open the first surah with available translations and recitation.',
    reference: 'Qur’an 1',
    url: 'https://quran.com/1',
    action: 'Read Al-Fatihah',
  },
  {
    title: 'Ayat al-Kursi',
    topic: 'Al-Baqarah 2:255',
    description: 'Read the verse in Surah Al-Baqarah with translation and recitation options.',
    reference: 'Qur’an 2:255',
    url: 'https://quran.com/2/255',
    action: 'Read the verse',
  },
  {
    title: 'Al-Ikhlas',
    topic: 'Surah 112',
    description: 'Read Surah Al-Ikhlas with translation and recitation options.',
    reference: 'Qur’an 112',
    url: 'https://quran.com/112',
    action: 'Read Al-Ikhlas',
  },
  {
    title: 'Al-Falaq and An-Nas',
    topic: 'Surahs 113–114',
    description: 'Read the final two surahs of the Qur’an with translations and recitation options.',
    reference: 'Qur’an 113–114',
    url: 'https://quran.com/113',
    action: 'Read Al-Falaq',
  },
];

const faqData = [
  {
    question: 'What should I do if I am late for prayer?',
    answer: 'Make your intention, join the prayer as soon as possible, and do not delay unnecessarily. If you miss a prayer, seek to make it up as soon as it is possible in the Sunnah manner, while keeping your intention sincere and regular.',
  },
  {
    question: 'Can visitors attend the mosque for salah?',
    answer: 'Yes. The mosque is open to worshippers who wish to join the congregational prayer and benefit from the learning environment, as long as they respect the mosque etiquette and shared space.',
  },
  {
    question: 'What is the best way to prepare for Friday prayer?',
    answer: 'Arrive early, make ghusl if possible, wear clean clothing, and listen attentively to the khutbah. It is also recommended to recite Surah Al-Kahf, make supplication, and be mindful of the Friday reminder.',
  },
  {
    question: 'How can a beginner start learning about Salah?',
    answer: 'Begin with the basics: the conditions of salah, the pillars, the proper movements, and regular practice. A beginner-friendly approach is to learn one step at a time, ideally with a teacher or a trusted local class.',
  },
  {
    question: 'Are the prayer times shown here final for every day?',
    answer: 'The timetable is a useful local reference and may be adjusted for Ramadan, special Islamic occasions, and notice-board announcements. Always check the mosque notice board for the most current schedule.',
  },
];

const defaultDhikr = [
  { label: 'SubhanAllah', value: 'SubhanAllah' },
  { label: 'Alhamdulillah', value: 'Alhamdulillah' },
  { label: 'Allahu Akbar', value: 'Allahu Akbar' },
  { label: 'Astaghfirullah', value: 'Astaghfirullah' },
];

const state = {
  activeDate: new Date(),
  selectedDate: null,
  filter: 'upcoming',
  theme: localStorage.getItem('masjid-theme') || 'light',
  dhikrValue: defaultDhikr[0].value,
  dhikrCount: Number(localStorage.getItem('masjid-dhikr-count') || 0),
  target: Number(localStorage.getItem('masjid-dhikr-target') || 33),
  prayerTimes: null,
  prayerApiError: null,
};

let timerId = null;

function buildWeeklyJummahEvents(reference = new Date(), count = 52) {
  const firstFriday = new Date(reference);
  const daysUntilFriday = (5 - firstFriday.getDay() + 7) % 7;
  firstFriday.setDate(firstFriday.getDate() + daysUntilFriday);
  firstFriday.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(firstFriday);
    date.setDate(date.getDate() + index * 7);

    return {
      date: formatISODate(date),
      title: "Jumu'ah Prayer",
      time: '2:30 PM',
      details: 'Friday congregational prayer.',
      category: 'Prayer',
    };
  });
}

const events = buildWeeklyJummahEvents();

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFriendlyDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getNextWeekdayDate(weekday, reference = new Date()) {
  const date = new Date(reference);
  const delta = (weekday + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + delta);
  return date;
}

function timeStringToDate(timeString, reference = new Date()) {
  if (!timeString || typeof timeString !== 'string') {
    return new Date(reference);
  }

  const [time, period] = timeString.split(' ');
  if (!time || !period) {
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date(reference);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  const [hour, minute] = time.split(':').map(Number);
  const date = new Date(reference);
  const normalizedHour = (hour % 12) + (period === 'PM' ? 12 : 0);
  date.setHours(normalizedHour, minute, 0, 0);
  return date;
}

function parseApiTime(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const [timePart, meridiem] = trimmed.split(' ');
  if (!timePart) return null;

  const [hour, minute] = timePart.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  const date = new Date();
  let normalizedHour = hour;

  if (meridiem && meridiem.toLowerCase() === 'pm' && normalizedHour !== 12) {
    normalizedHour += 12;
  }

  if (meridiem && meridiem.toLowerCase() === 'am' && normalizedHour === 12) {
    normalizedHour = 0;
  }

  date.setHours(normalizedHour, minute, 0, 0);
  return date;
}

function getPrayerScheduleSourceLabel() {
  return state.prayerApiError
    ? 'Public timetable unavailable. Confirm with the mosque notice board.'
    : 'Public timetable for Ikorodu, Lagos via Aladhan. Confirm during Ramadan or special announcements.';
}

function setPrayerApiError(message) {
  state.prayerApiError = message;
  const prayerTable = document.getElementById('prayerTable');
  if (prayerTable) {
    prayerTable.innerHTML = `
      <div class="prayer-row">
        <strong>Prayer times</strong>
        <span>${message}</span>
      </div>
    `;
  }
}

async function loadPrayerTimes() {
  try {
    const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Ikorodu&country=Nigeria&method=2');
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const timings = data?.data?.timings;
    if (!timings) {
      throw new Error('No prayer timings returned by the API.');
    }

    state.prayerApiError = null;
    state.prayerTimes = [
      { name: 'Fajr', time: timings.Fajr },
      { name: 'Sunrise', time: timings.Sunrise },
      { name: 'Dhuhr', time: timings.Dhuhr },
      { name: 'Asr', time: timings.Asr },
      { name: 'Maghrib', time: timings.Maghrib },
      { name: 'Isha', time: timings.Isha },
    ];
    updatePrayerDisplay();
  } catch (error) {
    state.prayerTimes = null;
    state.prayerApiError = 'Public prayer timetable could not be loaded right now.';
    updatePrayerDisplay();
  }
}

function createCalendarDays(year, month) {
  const calendarGrid = document.getElementById('calendarGrid');
  calendarGrid.innerHTML = '';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach((name) => {
    const label = document.createElement('span');
    label.textContent = name;
    calendarGrid.appendChild(label);
  });

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i += 1) {
    const placeholder = document.createElement('div');
    placeholder.className = 'calendar-day empty';
    placeholder.setAttribute('aria-hidden', 'true');
    calendarGrid.appendChild(placeholder);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day);
    const dateKey = formatISODate(current);
    const dayNode = document.createElement('button');
    dayNode.type = 'button';
    dayNode.className = 'calendar-day';
    dayNode.dataset.date = dateKey;
    dayNode.innerHTML = `<strong>${day}</strong>`;

    if (events.some((event) => event.date === dateKey)) {
      dayNode.classList.add('has-event');
    }

    if (current.toDateString() === new Date().toDateString()) {
      dayNode.classList.add('today');
    }

    if (state.selectedDate === dateKey) {
      dayNode.classList.add('selected');
    }

    dayNode.addEventListener('click', () => {
      state.selectedDate = dateKey;
      renderCalendar();
      renderEventList();
    });

    calendarGrid.appendChild(dayNode);
  }
}

function getFilteredEvents() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayKey = formatISODate(today);
  const future = events.filter((event) => (
    event.date > todayKey ||
    (event.date === todayKey && timeStringToDate(event.time, today) >= now)
  ));

  if (state.selectedDate) {
    return events.filter((event) => event.date === state.selectedDate);
  }

  if (state.filter === 'all') {
    return events;
  }

  if (state.filter === 'week') {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    return future.filter((event) => new Date(event.date) <= weekEnd);
  }

  return future;
}

function renderEventCount(count) {
  const eventCount = document.getElementById('eventCount');
  eventCount.textContent = `${count} ${count === 1 ? 'event' : 'events'}`;
}

function renderEventToolbar() {
  const toolbar = document.getElementById('eventToolbar');
  toolbar.innerHTML = '';

  const filters = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'week', label: 'This week' },
    { id: 'all', label: 'All' },
  ];

  filters.forEach((filter) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-chip ${state.filter === filter.id ? 'active' : ''}`;
    button.textContent = filter.label;
    button.addEventListener('click', () => {
      state.filter = filter.id;
      state.selectedDate = null;
      renderEventToolbar();
      renderEventList();
      renderCalendar();
    });
    toolbar.appendChild(button);
  });
}

function renderEventList() {
  const eventList = document.getElementById('eventList');
  eventList.innerHTML = '';
  const filteredEvents = getFilteredEvents();

  const selectedDayLabel = document.getElementById('selectedDayLabel');
  if (state.selectedDate) {
    selectedDayLabel.textContent = `Showing ${formatFriendlyDate(new Date(state.selectedDate))}`;
  } else {
    selectedDayLabel.textContent = 'Select a day to see details.';
  }

  renderEventCount(filteredEvents.length);

  if (filteredEvents.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = state.selectedDate
      ? 'No events are scheduled for this date.'
      : 'No upcoming mosque events are currently listed.';
    eventList.appendChild(empty);
    return;
  }

  filteredEvents.forEach((event) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <div class="event-item-row">
        <strong>${event.title}</strong>
        <span class="event-tag">${event.category}</span>
      </div>
      <span>${formatFriendlyDate(new Date(event.date))} · ${event.time}</span>
      <p>${event.details}</p>
    `;
    eventList.appendChild(item);
  });
}

function getPrayerEntries(reference = new Date()) {
  const base = new Date(reference);
  base.setHours(0, 0, 0, 0);

  if (!state.prayerTimes || !state.prayerTimes.length) {
    return [];
  }

  return state.prayerTimes.map((entry) => ({
    ...entry,
    date: parseApiTime(entry.time) || timeStringToDate(entry.time, base),
  }));
}

function getNextPrayer() {
  if (!state.prayerTimes || !state.prayerTimes.length) {
    return null;
  }

  const now = new Date();
  const currentDayPrayers = getPrayerEntries(now);
  const upcoming = currentDayPrayers.filter((entry) => entry.date > now);

  if (upcoming.length > 0) {
    return upcoming[0];
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const firstPrayer = state.prayerTimes[0];
  return {
    ...firstPrayer,
    date: parseApiTime(firstPrayer.time) || timeStringToDate(firstPrayer.time, tomorrow),
  };
}

function formatCountdown(milliseconds) {
  if (milliseconds <= 0) {
    return 'Prayer time has arrived.';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updatePrayerDisplay() {
  const now = new Date();
  const nextPrayer = getNextPrayer();
  const currentDayPrayers = getPrayerEntries(now);
  const prayerTable = document.getElementById('prayerTable');
  const nextPrayerName = document.getElementById('nextPrayerName');
  const nextPrayerTime = document.getElementById('nextPrayerTime');
  const countdownText = document.getElementById('countdownText');
  const nextPrayerNameDetailed = document.getElementById('nextPrayerNameDetailed');
  const nextPrayerTimeDetailed = document.getElementById('nextPrayerTimeDetailed');
  const countdownTextDetailed = document.getElementById('countdownTextDetailed');
  const todayDate = document.getElementById('todayDate');
  const currentPrayerLabel = document.getElementById('currentPrayerLabel');

  if (!nextPrayer) {
    todayDate.textContent = `Today: ${formatFriendlyDate(now)}`;
    currentPrayerLabel.textContent = `Today · ${formatFriendlyDate(now)}`;
    if (nextPrayerName) nextPrayerName.textContent = 'Prayer timetable unavailable';
    if (nextPrayerTime) nextPrayerTime.textContent = '--';
    if (countdownText) countdownText.textContent = state.prayerApiError || 'Unable to load the public timetable right now.';
    if (nextPrayerNameDetailed) nextPrayerNameDetailed.textContent = 'Prayer timetable unavailable';
    if (nextPrayerTimeDetailed) nextPrayerTimeDetailed.textContent = '--';
    if (countdownTextDetailed) countdownTextDetailed.textContent = getPrayerScheduleSourceLabel();
    if (prayerTable) {
      prayerTable.innerHTML = '<div class="prayer-row"><strong>Prayer times</strong><span>Unavailable</span></div>';
    }
    return;
  }

  const timeUntil = nextPrayer.date - now;
  const nextLabelText = `${nextPrayer.name} begins in`;

  todayDate.textContent = `Today: ${formatFriendlyDate(now)}`;
  currentPrayerLabel.textContent = `Today · ${formatFriendlyDate(now)}`;
  nextPrayerName.textContent = nextPrayer.name;
  nextPrayerTime.textContent = nextPrayer.time;
  countdownText.textContent = `${nextLabelText} ${formatCountdown(timeUntil)}`;
  nextPrayerNameDetailed.textContent = nextPrayer.name;
  nextPrayerTimeDetailed.textContent = nextPrayer.time;
  countdownTextDetailed.textContent = `${nextLabelText} ${formatCountdown(timeUntil)}`;
  if (todayDate) todayDate.textContent = `Today: ${formatFriendlyDate(now)} · ${getPrayerScheduleSourceLabel()}`;

  prayerTable.innerHTML = currentDayPrayers
    .map((entry) => {
      const rowClass = entry.name === nextPrayer.name ? 'prayer-row next' : 'prayer-row';
      return `
        <div class="${rowClass}">
          <strong>${entry.name}</strong>
          <span>${entry.time}</span>
        </div>
      `;
    })
    .join('');
}

function initializeContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (!form || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('visitorName')?.value.trim();
    const email = document.getElementById('visitorEmail')?.value.trim();
    const message = document.getElementById('visitorMessage')?.value.trim();

    if (!name || !email || !message) {
      status.textContent = 'Please complete all the fields before sending your message.';
      status.className = 'form-status error';
      return;
    }

    const mailto = `mailto:addysam@yahoo.com?subject=${encodeURIComponent(`Message from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    status.textContent = 'Opening your email app to send the message.';
    status.className = 'form-status success';
    window.location.href = mailto;
  });
}

function renderCalendar() {
  const month = state.activeDate.getMonth();
  const year = state.activeDate.getFullYear();

  document.getElementById('calendarMonth').textContent = state.activeDate.toLocaleString('en-GB', { month: 'long' });
  document.getElementById('calendarYear').textContent = year;

  createCalendarDays(year, month);
  renderEventList();
}

function initializeCalendarButtons() {
  document.getElementById('prevMonth').addEventListener('click', () => {
    state.activeDate.setMonth(state.activeDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    state.activeDate.setMonth(state.activeDate.getMonth() + 1);
    renderCalendar();
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const button = document.getElementById('themeToggle');
  const label = button?.querySelector('.theme-toggle-label');

  if (label) {
    label.textContent = theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';
  }

  button?.setAttribute('aria-pressed', String(theme === 'dark'));
  localStorage.setItem('masjid-theme', theme);
}

function initializeThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');

  themeToggle?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
  });

  applyTheme(state.theme);
}

function initializeMobileNav() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function renderQuranResources() {
  const container = document.getElementById('quranResults');
  if (!container) return;

  container.innerHTML = quranData
    .map(
      (resource) => `
        <article class="quran-card">
          <p class="card-tag">${resource.topic}</p>
          <h3>${resource.title}</h3>
          <p>${resource.description}</p>
          <p class="source">${resource.reference}</p>
          <a class="resource-link" href="${resource.url}" target="_blank" rel="noopener noreferrer">${resource.action}<span aria-hidden="true"> ↗</span></a>
        </article>
      `,
    )
    .join('');
}

function updateDhikrProgress() {
  const progressBar = document.getElementById('dhikrProgress');
  const targetInput = document.getElementById('targetInput');
  const counterDisplay = document.getElementById('counterDisplay');

  if (!progressBar || !targetInput || !counterDisplay) return;

  const target = Number(targetInput.value) || 1;
  if (target !== state.target) {
    state.target = target;
    localStorage.setItem('masjid-dhikr-target', String(target));
  }

  const progress = Math.min((state.dhikrCount / state.target) * 100, 100);
  progressBar.style.width = `${progress}%`;
  counterDisplay.textContent = state.dhikrCount;
}

function renderDhikrPresets() {
  const presetList = document.getElementById('presetList');
  if (!presetList) return;

  presetList.innerHTML = defaultDhikr
    .map(
      (item) => `
        <button class="preset-btn ${state.dhikrValue === item.value ? 'active' : ''}" type="button" data-value="${item.value}">
          ${item.label}
        </button>
      `,
    )
    .join('');

  presetList.querySelectorAll('.preset-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.dhikrValue = button.dataset.value;
      const word = document.getElementById('dhikrWord');
      if (word) {
        word.textContent = state.dhikrValue;
      }
      renderDhikrPresets();
    });
  });
}

function initializeDhikr() {
  const counterDisplay = document.getElementById('counterDisplay');
  const word = document.getElementById('dhikrWord');
  const incrementButton = document.getElementById('incrementDhikr');
  const resetButton = document.getElementById('resetDhikr');
  const targetInput = document.getElementById('targetInput');

  if (word) {
    word.textContent = state.dhikrValue;
  }

  if (counterDisplay) {
    counterDisplay.textContent = state.dhikrCount;
  }

  incrementButton?.addEventListener('click', () => {
    state.dhikrCount += 1;
    localStorage.setItem('masjid-dhikr-count', String(state.dhikrCount));
    updateDhikrProgress();
  });

  resetButton?.addEventListener('click', () => {
    state.dhikrCount = 0;
    localStorage.setItem('masjid-dhikr-count', '0');
    updateDhikrProgress();
  });

  targetInput?.addEventListener('input', () => {
    updateDhikrProgress();
  });

  renderDhikrPresets();
  updateDhikrProgress();
}

function renderFaqs() {
  const faqList = document.getElementById('faqList');
  if (!faqList) return;

  faqList.innerHTML = faqData
    .map(
      (item, index) => `
        <div class="faq-item">
          <button class="faq-question" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}">
            ${item.question}
            <span aria-hidden="true">+</span>
          </button>
          <div class="faq-answer" ${index === 0 ? '' : 'hidden'}>
            <p>${item.answer}</p>
          </div>
        </div>
      `,
    )
    .join('');

  faqList.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const answer = button.nextElementSibling;
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
      answer.hidden = isExpanded;
      button.querySelector('span').textContent = isExpanded ? '+' : '−';
    });
  });
}

function init() {
  initializeThemeToggle();
  initializeMobileNav();
  initializeCalendarButtons();
  renderQuranResources();
  initializeDhikr();
  initializeContactForm();
  renderFaqs();
  renderEventToolbar();
  renderCalendar();
  updatePrayerDisplay();
  loadPrayerTimes();

  if (timerId) {
    clearInterval(timerId);
  }

  timerId = setInterval(updatePrayerDisplay, 1000);
}

document.addEventListener('DOMContentLoaded', init);
