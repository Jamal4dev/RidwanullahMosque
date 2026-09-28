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
    links: [
      { url: 'https://quran.com/113', label: 'Read Al-Falaq' },
      { url: 'https://quran.com/114', label: 'Read An-Nas' },
    ],
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

// =====================================================
// MOSQUE IQAMAH TIMES - EDIT THESE VALUES MANUALLY
// Leave a value null until the mosque confirms its time.
// These values are separate from Aladhan Adhan timings.
// =====================================================
const IQAMAH_TIMES = {
  Fajr: null,
  Dhuhr: null,
  Asr: null,
  Maghrib: null,
  Isha: null,
};

const JUMUAH_TIME = '2:30 PM';
const JUMUAH_EVENT_COUNT = 52;
const PRAYER_TIME_ZONE = 'Africa/Lagos';
const PRAYER_REFRESH_INTERVAL = 60 * 1000;
const PRAYER_RETRY_INTERVAL = 30 * 60 * 1000;
const PRAYER_API_URL = 'https://api.aladhan.com/v1/timingsByCity?city=Ikorodu&country=Nigeria&method=2';

function readStorage(key, fallback) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch (error) {
    console.warn('Browser storage is unavailable.', error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Browser storage is unavailable.', error);
  }
}

function readStoredInteger(key, fallback, minimum = 0, maximum = 1000000) {
  const value = Number(readStorage(key, fallback));
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : fallback;
}

const savedTheme = readStorage('masjid-theme', 'light');

const state = {
  activeDate: new Date(),
  selectedDate: null,
  filter: 'upcoming',
  theme: ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'light',
  dhikrValue: defaultDhikr[0].value,
  dhikrCount: readStoredInteger('masjid-dhikr-count', 0),
  target: readStoredInteger('masjid-dhikr-target', 33, 1),
  prayerTimes: null,
  prayerApiError: null,
};

let countdownTimerId = null;
let prayerRefreshTimerId = null;
let lastPrayerRequestDate = null;
let lastPrayerRequestAt = 0;
let isPrayerRequestPending = false;

function buildWeeklyJummahEvents(reference = new Date(), count = JUMUAH_EVENT_COUNT) {
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
      time: JUMUAH_TIME,
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

function parseISODate(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function formatFriendlyDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatPrayerDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: PRAYER_TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function parseApiTime(value, reference = new Date()) {
  if (typeof value !== 'string') return null;

  const match = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i.exec(value.trim());
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) return null;

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  const dateParts = reference instanceof Date ? getDatePartsInPrayerTimeZone(reference) : reference;
  const wallClockUtc = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, hour, minute);
  const representedParts = getDatePartsInPrayerTimeZone(new Date(wallClockUtc));
  const representedAsUtc = Date.UTC(
    representedParts.year,
    representedParts.month - 1,
    representedParts.day,
    representedParts.hour,
    representedParts.minute,
  );

  return new Date(wallClockUtc + wallClockUtc - representedAsUtc);
}

function timeStringToDate(value, reference = new Date()) {
  return parseApiTime(value, reference) || new Date(Number.NaN);
}

function getPrayerScheduleSourceLabel() {
  return state.prayerApiError
    ? 'Unable to load calculated prayer times. Confirm Adhan and Iqamah with the mosque.'
    : 'Calculated Adhan times from Aladhan. Iqamah times are set by the mosque.';
}

function getDatePartsInPrayerTimeZone(date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: PRAYER_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
}

function getPrayerDateKey(date = new Date()) {
  const { year, month, day } = getDatePartsInPrayerTimeZone(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function loadPrayerTimes() {
  if (isPrayerRequestPending) return;

  isPrayerRequestPending = true;
  const requestedDate = getPrayerDateKey();
  const controller = new AbortController();
  const requestTimeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(PRAYER_API_URL, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const timings = data?.data?.timings;
    if (!timings) {
      throw new Error('No prayer timings returned by the API.');
    }

    const prayerNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const reference = new Date();
    const prayerTimes = prayerNames.map((name) => {
      if (!parseApiTime(timings[name], reference)) {
        throw new Error(`Missing or invalid ${name} timing in the API response.`);
      }

      return { name, time: timings[name] };
    });

    state.prayerApiError = null;
    state.prayerTimes = prayerTimes;
    renderPrayerSchedule();
    updatePrayerDisplay();
  } catch (error) {
    state.prayerTimes = null;
    state.prayerApiError = 'Public prayer timetable could not be loaded right now.';
    console.error('Unable to load Aladhan prayer timings.', error);
    renderPrayerSchedule();
    updatePrayerDisplay();
  } finally {
    clearTimeout(requestTimeoutId);
    lastPrayerRequestDate = requestedDate;
    lastPrayerRequestAt = Date.now();
    isPrayerRequestPending = false;
  }
}

function refreshPrayerTimesIfNeeded() {
  const now = Date.now();
  const dateChanged = getPrayerDateKey() !== lastPrayerRequestDate;
  const retryDue = now - lastPrayerRequestAt >= PRAYER_RETRY_INTERVAL;

  if (dateChanged && lastPrayerRequestDate !== null) {
    state.prayerTimes = null;
    state.prayerApiError = 'Loading today’s calculated prayer times…';
    renderPrayerSchedule();
    updatePrayerDisplay();
  }

  if (!isPrayerRequestPending && (dateChanged || retryDue)) {
    loadPrayerTimes();
  }
}

function createPrayerCell(text, className, role) {
  const cell = document.createElement('span');
  cell.className = className;
  cell.setAttribute('role', role);
  cell.textContent = text;
  return cell;
}

function getIqamahDisplayTime(name) {
  const time = IQAMAH_TIMES[name];
  return parseApiTime(time) ? time : 'Not set';
}

function renderPrayerSchedule() {
  const prayerTable = document.getElementById('prayerTable');
  if (!prayerTable) return;

  const today = new Date();
  const currentPrayerLabel = document.getElementById('currentPrayerLabel');
  const todayDate = document.getElementById('todayDate');
  if (currentPrayerLabel) currentPrayerLabel.textContent = `Today · ${formatPrayerDate(today)}`;
  if (todayDate) todayDate.textContent = `${formatPrayerDate(today)} · ${getPrayerScheduleSourceLabel()}`;

  prayerTable.replaceChildren();
  if (!state.prayerTimes) {
    prayerTable.removeAttribute('role');
    prayerTable.removeAttribute('aria-label');
    const message = document.createElement('p');
    message.className = 'prayer-row schedule-message';
    message.setAttribute('role', 'status');
    message.textContent = state.prayerApiError || 'Loading calculated Adhan times…';
    prayerTable.appendChild(message);
    return;
  }

  prayerTable.setAttribute('role', 'table');
  prayerTable.setAttribute('aria-label', 'Calculated Adhan and mosque Iqamah times');
  const header = document.createElement('div');
  header.className = 'prayer-row prayer-header';
  header.setAttribute('role', 'row');
  header.append(
    createPrayerCell('Prayer', 'prayer-name', 'columnheader'),
    createPrayerCell('Adhan', 'prayer-time', 'columnheader'),
    createPrayerCell('Iqamah', 'prayer-time', 'columnheader'),
  );
  prayerTable.appendChild(header);

  state.prayerTimes.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'prayer-row';
    row.dataset.prayer = entry.name;
    row.setAttribute('role', 'row');
    const iqamah = Object.hasOwn(IQAMAH_TIMES, entry.name) ? getIqamahDisplayTime(entry.name) : '—';
    row.append(
      createPrayerCell(entry.name, 'prayer-name', 'rowheader'),
      createPrayerCell(entry.time, 'prayer-time', 'cell'),
      createPrayerCell(iqamah, 'prayer-time', 'cell'),
    );
    prayerTable.appendChild(row);
  });
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
      dayNode.setAttribute('aria-current', 'date');
    }

    if (state.selectedDate === dateKey) {
      dayNode.classList.add('selected');
    }
    dayNode.setAttribute('aria-label', formatFriendlyDate(current));
    dayNode.setAttribute('aria-pressed', String(state.selectedDate === dateKey));

    dayNode.addEventListener('click', () => {
      state.selectedDate = dateKey;
      calendarGrid.querySelectorAll('.calendar-day[data-date]').forEach((dayButton) => {
        const isSelected = dayButton.dataset.date === dateKey;
        dayButton.classList.toggle('selected', isSelected);
        dayButton.setAttribute('aria-pressed', String(isSelected));
      });
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
    return future.filter((event) => {
      const eventDate = parseISODate(event.date);
      return eventDate && eventDate <= weekEnd;
    });
  }

  return future;
}

function renderEventCount(count) {
  const eventCount = document.getElementById('eventCount');
  eventCount.textContent = `${count} ${count === 1 ? 'event' : 'events'}`;
}

function renderEventToolbar() {
  const toolbar = document.getElementById('eventToolbar');
  toolbar.querySelectorAll('.filter-chip').forEach((button) => button.remove());

  const filters = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'week', label: 'This week' },
    { id: 'all', label: 'All' },
  ];

  filters.forEach((filter) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-chip ${state.filter === filter.id ? 'active' : ''}`;
    button.dataset.filter = filter.id;
    button.textContent = filter.label;
    button.setAttribute('aria-pressed', String(state.filter === filter.id));
    button.addEventListener('click', () => {
      state.filter = filter.id;
      state.selectedDate = null;
      toolbar.querySelectorAll('.filter-chip').forEach((filterButton) => {
        const isActive = filterButton.dataset.filter === state.filter;
        filterButton.classList.toggle('active', isActive);
        filterButton.setAttribute('aria-pressed', String(isActive));
      });
      document.querySelectorAll('.calendar-day.selected').forEach((dayButton) => {
        dayButton.classList.remove('selected');
        dayButton.setAttribute('aria-pressed', 'false');
      });
      renderEventList();
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
    selectedDayLabel.textContent = `Showing ${formatFriendlyDate(parseISODate(state.selectedDate))}`;
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
      <span>${formatFriendlyDate(parseISODate(event.date))} · ${event.time}</span>
      <p>${event.details}</p>
    `;
    eventList.appendChild(item);
  });
}

function getNextPrayer(reference = new Date()) {
  if (!state.prayerTimes?.length) return null;

  const now = new Date(reference);
  const obligatoryPrayers = state.prayerTimes.filter((entry) => entry.name !== 'Sunrise');
  const nextToday = obligatoryPrayers
    .map((entry) => ({ ...entry, date: parseApiTime(entry.time, now) }))
    .find((entry) => entry.date && entry.date > now);

  if (nextToday) return nextToday;

  const fajr = obligatoryPrayers.find((entry) => entry.name === 'Fajr');
  if (!fajr) return null;

  const prayerDateParts = getDatePartsInPrayerTimeZone(now);
  const tomorrow = new Date(Date.UTC(prayerDateParts.year, prayerDateParts.month - 1, prayerDateParts.day + 1));
  const tomorrowParts = {
    year: tomorrow.getUTCFullYear(),
    month: tomorrow.getUTCMonth() + 1,
    day: tomorrow.getUTCDate(),
  };
  return { ...fajr, date: parseApiTime(fajr.time, tomorrowParts) };
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

function setTextIfChanged(elementId, value) {
  const element = document.getElementById(elementId);
  if (element && element.textContent !== value) element.textContent = value;
}

let lastHighlightedPrayer = null;

function updateNextPrayerHighlight(prayerName) {
  if (lastHighlightedPrayer === prayerName) return;

  document.querySelectorAll('.prayer-row[data-prayer]').forEach((row) => {
    row.classList.toggle('next', row.dataset.prayer === prayerName);
  });
  lastHighlightedPrayer = prayerName;
}

function updatePrayerDisplay() {
  const now = new Date();
  const nextPrayer = getNextPrayer(now);

  if (!nextPrayer) {
    setTextIfChanged('nextPrayerName', 'Prayer times unavailable');
    setTextIfChanged('nextPrayerNameDetailed', 'Prayer times unavailable');
    setTextIfChanged('nextPrayerTime', '--');
    setTextIfChanged('nextPrayerTimeDetailed', '--');
    setTextIfChanged('countdownText', state.prayerApiError || 'Loading calculated Adhan times…');
    setTextIfChanged('countdownTextDetailed', getPrayerScheduleSourceLabel());
    return;
  }

  const nextPrayerLabel = `${nextPrayer.name} begins in`;
  const countdown = formatCountdown(nextPrayer.date - now);
  setTextIfChanged('nextPrayerName', nextPrayer.name);
  setTextIfChanged('nextPrayerNameDetailed', nextPrayer.name);
  setTextIfChanged('nextPrayerTime', nextPrayer.time);
  setTextIfChanged('nextPrayerTimeDetailed', nextPrayer.time);
  setTextIfChanged('countdownText', `${nextPrayerLabel} ${countdown}`);
  setTextIfChanged('countdownTextDetailed', `${nextPrayerLabel} ${countdown}`);
  updateNextPrayerHighlight(nextPrayer.name);
}

function createContactMailto(name, email, message) {
  const subject = encodeURIComponent('Message from ' + name);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
  return `mailto:addysam@yahoo.com?subject=${subject}&body=${body}`;
}

function initializeContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (!form || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameInput = document.getElementById('visitorName');
    const emailInput = document.getElementById('visitorEmail');
    const messageInput = document.getElementById('visitorMessage');
    const name = nameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const message = messageInput?.value.trim() || '';
    const separator = email.indexOf('@');
    const finalDot = email.lastIndexOf('.');
    const emailIsValid = Boolean(
      emailInput?.checkValidity() &&
      separator > 0 &&
      separator === email.lastIndexOf('@') &&
      finalDot > separator + 1 &&
      email.length - finalDot > 2 &&
      !email.includes(' ')
    );

    [nameInput, emailInput, messageInput].forEach((input) => {
      if (input) input.setAttribute('aria-invalid', String(!input.value.trim()));
    });

    if (!name || !email || !message || !emailIsValid) {
      status.textContent = 'Please complete all fields and enter a valid email address.';
      status.className = 'form-status error';
      if (emailInput && email && !emailIsValid) emailInput.setAttribute('aria-invalid', 'true');
      return;
    }

    const mailto = createContactMailto(name, email, message);
    status.textContent = 'Your email client should open with the message prepared. It has not been sent yet.';
    status.className = 'form-status';
    window.location.href = mailto;
  });

  form.querySelectorAll('input, textarea').forEach((input) => {
    input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
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
  const changeMonth = (offset) => {
    state.activeDate = new Date(state.activeDate.getFullYear(), state.activeDate.getMonth() + offset, 1);
    renderCalendar();
  };

  document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
  document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
}

function applyTheme(theme) {
  state.theme = ['light', 'dark', 'system'].includes(theme) ? theme : 'light';
  let resolvedTheme = state.theme;
  if (resolvedTheme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = resolvedTheme;
  const button = document.getElementById('themeToggle');
  const label = button?.querySelector('.theme-toggle-label');

  if (label) {
    label.textContent = resolvedTheme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';
  }

  button?.setAttribute('aria-pressed', String(resolvedTheme === 'dark'));
  button?.setAttribute('aria-label', `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`);
  writeStorage('masjid-theme', state.theme);
}

function initializeThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');

  themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.dataset.theme;
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  applyTheme(state.theme);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'system') applyTheme('system');
  });
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
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    });
  });
}

function renderQuranResources() {
  const container = document.getElementById('quranResults');
  if (!container) return;

  container.innerHTML = quranData
    .map(
      (resource) => {
        const links = resource.links || [{ url: resource.url, label: resource.action }];
        return `
        <article class="quran-card">
          <p class="card-tag">${resource.topic}</p>
          <h3>${resource.title}</h3>
          <p>${resource.description}</p>
          <p class="source">${resource.reference}</p>
          <div class="resource-links">
            ${links.map((link) => `<a class="resource-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}<span aria-hidden="true"> ↗</span></a>`).join('')}
          </div>
        </article>
        `;
      },
    )
    .join('');
}

function updateDhikrProgress() {
  const progressBar = document.getElementById('dhikrProgress');
  const targetInput = document.getElementById('targetInput');
  const counterDisplay = document.getElementById('counterDisplay');

  if (!progressBar || !targetInput || !counterDisplay) return;

  const requestedTarget = Number(targetInput.value);
  const targetIsValid = Number.isSafeInteger(requestedTarget) && requestedTarget >= 1 && requestedTarget <= 1000000;
  targetInput.setAttribute('aria-invalid', String(!targetIsValid));
  if (targetIsValid && requestedTarget !== state.target) {
    state.target = requestedTarget;
    writeStorage('masjid-dhikr-target', String(requestedTarget));
  }

  const activeTarget = targetIsValid ? requestedTarget : state.target;
  progressBar.max = activeTarget;
  progressBar.value = Math.min(state.dhikrCount, activeTarget);
  progressBar.textContent = `${progressBar.value} of ${activeTarget}`;
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

  if (targetInput) {
    targetInput.value = String(state.target);
  }

  incrementButton?.addEventListener('click', () => {
    state.dhikrCount = Math.min(state.dhikrCount + 1, 1000000);
    writeStorage('masjid-dhikr-count', String(state.dhikrCount));
    updateDhikrProgress();
  });

  resetButton?.addEventListener('click', () => {
    state.dhikrCount = 0;
    writeStorage('masjid-dhikr-count', '0');
    updateDhikrProgress();
  });

  targetInput?.addEventListener('input', () => {
    updateDhikrProgress();
  });

  targetInput?.addEventListener('change', () => {
    if (targetInput.getAttribute('aria-invalid') === 'true') {
      targetInput.value = String(state.target);
      updateDhikrProgress();
    }
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
          <button class="faq-question" id="faqQuestion-${index}" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="faqAnswer-${index}">
            ${item.question}
            <span aria-hidden="true">${index === 0 ? '−' : '+'}</span>
          </button>
          <div class="faq-answer" id="faqAnswer-${index}" aria-labelledby="faqQuestion-${index}" ${index === 0 ? '' : 'hidden'}>
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

function initializeSafely(name, initializer) {
  try {
    initializer();
  } catch (error) {
    console.error(`${name} initialization failed.`, error);
  }
}

function init() {
  [
    ['Theme', initializeThemeToggle],
    ['Navigation', initializeMobileNav],
    ['Calendar controls', initializeCalendarButtons],
    ['Qur’an resources', renderQuranResources],
    ['Dhikr counter', initializeDhikr],
    ['Contact form', initializeContactForm],
    ['FAQs', renderFaqs],
    ['Event filters', renderEventToolbar],
    ['Calendar', renderCalendar],
  ].forEach(([name, initializer]) => initializeSafely(name, initializer));

  initializeSafely('Prayer schedule', renderPrayerSchedule);
  updatePrayerDisplay();
  loadPrayerTimes();

  clearInterval(countdownTimerId);
  clearInterval(prayerRefreshTimerId);
  countdownTimerId = setInterval(updatePrayerDisplay, 1000);
  prayerRefreshTimerId = setInterval(refreshPrayerTimesIfNeeded, PRAYER_REFRESH_INTERVAL);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshPrayerTimesIfNeeded();
      updatePrayerDisplay();
    }
  });
}

document.addEventListener('DOMContentLoaded', init, { once: true });
