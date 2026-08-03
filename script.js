const prayerSchedule = [
  { name: 'Fajr', time: '5:40 AM' },
  { name: 'Dhuhr', time: '1:00 PM' },
  { name: 'Asr', time: '4:15 PM' },
  { name: 'Maghrib', time: '7:00 PM' },
  { name: 'Isha', time: '8:15 PM' },
];

const eventTemplates = [
  { title: "Jumu'ah Prayer & Khutbah", time: '2:30 PM', details: 'Join the congregational Friday prayer with a community sermon and fellowship.', weekday: 5 },
  { title: 'As-Salatul', time: '6:30 AM', details: 'Serene morning prayer session for spiritual reflection.', weekday: 0 },
];  

const state = {
  activeDate: new Date(),
  selectedDate: null,
  filter: 'upcoming',
  theme: localStorage.getItem('masjid-theme') || 'light',
};

const events = buildEventSchedule();
let timerId = null;

function buildEventSchedule() {
  const today = new Date();

  return eventTemplates.flatMap(template => {
    return Array.from({ length: 4 }, (_, index) => {
      const date = getNextWeekdayDate(template.weekday, new Date(today));
      date.setDate(date.getDate() + index * 7);

      return {
        date: formatISODate(date),
        title: template.title,
        time: template.time,
        details: template.details,
      };
    });
  }).sort((left, right) => new Date(left.date) - new Date(right.date));
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFriendlyDate(date) {
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

function getNextWeekdayDate(weekday, reference = new Date()) {
  const date = new Date(reference);
  const delta = (weekday + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + delta);
  return date;
}

function timeStringToDate(timeString, reference = new Date()) {
  const [time, period] = timeString.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date(reference);
  const normalizedHour = hour % 12 + (period === 'PM' ? 12 : 0);
  date.setHours(normalizedHour, minute, 0, 0);
  return date;
}

function createCalendarDays(year, month) {
  const calendarGrid = document.getElementById('calendarGrid');
  calendarGrid.innerHTML = '';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(name => {
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

    if (events.some(event => event.date === dateKey)) {
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
  const today = new Date();
  const future = events.filter(event => new Date(event.date) >= today);

  if (state.selectedDate) {
    return events.filter(event => event.date === state.selectedDate);
  }

  if (state.filter === 'all') {
    return events;
  }

  if (state.filter === 'week') {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    return future.filter(event => new Date(event.date) <= weekEnd);
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

  filters.forEach(filter => {
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
    selectedDayLabel.textContent = 'Select a day to see its events.';
  }

  renderEventCount(filteredEvents.length);

  if (filteredEvents.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = state.selectedDate
      ? 'No mosque events are scheduled for this day.'
      : 'No upcoming events are available right now.';
    eventList.appendChild(emptyItem);
    return;
  }

  filteredEvents.forEach(event => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${event.title}</strong>
      <span>${formatFriendlyDate(new Date(event.date))} · ${event.time}</span>
      <p>${event.details}</p>
    `;
    eventList.appendChild(item);
  });
}

function getPrayerEntries(reference = new Date()) {
  const base = new Date(reference);
  base.setHours(0, 0, 0, 0);

  return prayerSchedule.map(entry => ({
    ...entry,
    date: timeStringToDate(entry.time, base),
  }));
}

function getNextPrayer() {
  const now = new Date();
  const currentDayPrayers = getPrayerEntries(now);
  const upcoming = currentDayPrayers.filter(entry => entry.date > now);

  if (upcoming.length > 0) {
    return upcoming[0];
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    ...prayerSchedule[0],
    date: timeStringToDate(prayerSchedule[0].time, tomorrow),
  };
}

function formatCountdown(milliseconds) {
  if (milliseconds <= 0) {
    return 'The next prayer time has arrived.';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function updatePrayerDisplay() {
  const now = new Date();
  const nextPrayer = getNextPrayer();
  const currentDayPrayers = getPrayerEntries(now);
  const prayerTable = document.getElementById('prayerTable');
  const nextPrayerName = document.getElementById('nextPrayerName');
  const nextPrayerTime = document.getElementById('nextPrayerTime');
  const countdownText = document.getElementById('countdownText');
  const todayDate = document.getElementById('todayDate');

  todayDate.textContent = `Today: ${formatFriendlyDate(now)}`;
  nextPrayerName.textContent = nextPrayer.name;
  nextPrayerTime.textContent = nextPrayer.time;
  countdownText.textContent = `Starts in ${formatCountdown(nextPrayer.date - now)}`;

  prayerTable.innerHTML = currentDayPrayers
    .map(entry => {
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
  document.documentElement.dataset.theme = theme;
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

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function init() {
  initializeThemeToggle();
  initializeMobileNav();
  initializeCalendarButtons();
  renderEventToolbar();
  renderCalendar();
  updatePrayerDisplay();

  if (timerId) {
    clearInterval(timerId);
  }

  timerId = setInterval(updatePrayerDisplay, 1000);
}

globalThis.addEventListener('DOMContentLoaded', init);
