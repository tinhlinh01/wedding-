document.addEventListener("DOMContentLoaded", function () {
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

    // ô trống trước ngày 1
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="calendar-day is-empty"></div>`;
    }

    // ngày trong tháng
    for (let day = 1; day <= totalDays; day++) {
      const isHighlight = day === highlightDay ? "is-highlight" : "";
      html += `<div class="calendar-day ${isHighlight}">${day}</div>`;
    }

    // ô trống sau ngày cuối tháng
    const renderedCells = firstDayIndex + totalDays;

    // nếu muốn luôn đủ 6 hàng = 42 ô
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
});