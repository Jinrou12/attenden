/**
 * Teacher Multi-Class Student Attendance System
 * App State & Interaction Logic with Cambodia Time (Asia/Phnom_Penh)
 * Schedule Rules:
 * 1. Default View: 1-Week Sheet (ស្រង់វត្តមាន ១ សប្តាហ៍)
 * 2. Exclude Sunday (ថ្ងៃអាទិត្យ ឈប់សម្រាក)
 * 3. Saturday Morning Only (ថ្ងៃសៅរ៍ រៀនតែ ១ ព្រឹក - AM Only)
 */

const KHMER_DAYS = ["អា", "ច", "អ", "ពុ", "ព្រ", "សុ", "សៅ"];
const KHMER_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
];

class AttendanceApp {
  constructor() {
    this.cambodiaTime = this.getCambodiaTime();
    this.data = this.loadData();
    
    this.data.activeShift = "ALL";
    this.activeTab = 'weekly';
    this.selectedDailyDate = this.cambodiaTime.day;
    this.selectedWeekIndex = this.getWeekIndexForDay(this.cambodiaTime.day);
    this.searchQuery = '';
    this.chartInstance = null;
    this.pendingExcelStudents = [];
    this.activeSelectedStatus = 'P';

    this.initElements();
    this.bindEvents();
    this.startCambodiaClock();
    this.render();
  }

  getCambodiaTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    let year = now.getFullYear(), month = now.getMonth() + 1, day = now.getDate(), hour = now.getHours(), minute = now.getMinutes(), second = now.getSeconds();

    parts.forEach(p => {
      if (p.type === 'year') year = parseInt(p.value);
      if (p.type === 'month') month = parseInt(p.value);
      if (p.type === 'day') day = parseInt(p.value);
      if (p.type === 'hour') hour = parseInt(p.value);
      if (p.type === 'minute') minute = parseInt(p.value);
      if (p.type === 'second') second = parseInt(p.value);
    });

    const isMorning = hour < 12;
    const shift = isMorning ? 'AM' : 'PM';
    const shiftText = isMorning ? '🌅 វេនព្រឹក' : '🌇 វេនល្ងាច';

    const pad = (n) => n < 10 ? '0' + n : n;
    const formattedClock = `${pad(hour)}:${pad(minute)}:${pad(second)} (${shiftText})`;

    return { year, month, day, hour, minute, second, shift, isMorning, shiftText, formattedClock };
  }

  getWeekIndexForDay(day) {
    if (day <= 7) return 0;
    if (day <= 14) return 1;
    if (day <= 21) return 2;
    if (day <= 28) return 3;
    return 4;
  }

  startCambodiaClock() {
    setInterval(() => {
      this.cambodiaTime = this.getCambodiaTime();
      const elClock = document.getElementById('cambodiaClockDisplay');
      if (elClock) {
        elClock.innerHTML = `<i class="lucide-clock" style="color: var(--primary);"></i> ម៉ោងកម្ពុជា៖ <strong>${this.cambodiaTime.formattedClock}</strong>`;
      }
    }, 1000);
  }

  loadData() {
    const saved = localStorage.getItem('TEACHER_ATTENDANCE_DATA');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.classes && parsed.classes.length > 0 && parsed.students && parsed.students.length > 0) {
          parsed.activeShift = 'ALL';
          const mainClsIndex = parsed.classes.findIndex(c => c.id === 'cls_12_chun_nath');
          if (mainClsIndex !== -1) {
            parsed.classes[mainClsIndex].name = DEFAULT_SAMPLE_DATA.classes[0].name;
            parsed.classes[mainClsIndex].room = "";
          } else {
            parsed.classes.unshift(DEFAULT_SAMPLE_DATA.classes[0]);
          }
          // Always update students for main class
          const nonG12Students = parsed.students.filter(s => s.classId !== 'cls_12_chun_nath');
          const g12Students = DEFAULT_SAMPLE_DATA.students.filter(s => s.classId === 'cls_12_chun_nath');
          parsed.students = [...g12Students, ...nonG12Students];

          parsed.activeClassId = 'cls_12_chun_nath';
          localStorage.setItem('TEACHER_ATTENDANCE_DATA', JSON.stringify(parsed));
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved attendance data", e);
      }
    }
    return DEFAULT_SAMPLE_DATA;
  }

  saveData() {
    localStorage.setItem('TEACHER_ATTENDANCE_DATA', JSON.stringify(this.data));
  }

  initElements() {
    this.elClassList = document.getElementById('classListNav');
    this.elMonthSelect = document.getElementById('monthSelect');
    this.elYearSelect = document.getElementById('yearSelect');
    this.elCurrentClassName = document.getElementById('currentClassName');
    this.elCurrentClassRoom = document.getElementById('currentClassRoom');

    this.elTabWeekly = document.getElementById('tabWeekly');
    this.elTabDaily = document.getElementById('tabDaily');
    this.elTabRoster = document.getElementById('tabRoster');
    this.elTabAnalytics = document.getElementById('tabAnalytics');

    this.elViewWeekly = document.getElementById('viewWeekly');
    this.elViewDaily = document.getElementById('viewDaily');
    this.elViewRoster = document.getElementById('viewRoster');
    this.elViewAnalytics = document.getElementById('viewAnalytics');

    this.elTotalStudents = document.getElementById('totalStudentsCount');
    this.elTotalPresent = document.getElementById('totalPresentCount');
    this.elTotalAbsent = document.getElementById('totalAbsentCount');
    this.elTotalRate = document.getElementById('totalAttendanceRate');
  }

  bindEvents() {
    if (this.elMonthSelect) {
      this.elMonthSelect.value = this.data.activeMonth;
      this.elMonthSelect.addEventListener('change', (e) => {
        this.data.activeMonth = parseInt(e.target.value);
        this.saveData();
        this.render();
      });
    }

    if (this.elYearSelect) {
      this.elYearSelect.value = this.data.activeYear;
      this.elYearSelect.addEventListener('change', (e) => {
        this.data.activeYear = parseInt(e.target.value);
        this.saveData();
        this.render();
      });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    const btnAddClass = document.getElementById('btnAddClass');
    if (btnAddClass) btnAddClass.addEventListener('click', () => this.openAddClassModal());

    const btnAddStudent = document.getElementById('btnAddStudent');
    if (btnAddStudent) btnAddStudent.addEventListener('click', () => this.openAddStudentModal());

    const btnMarkAll = document.getElementById('btnMarkAllPresentToday');
    if (btnMarkAll) btnMarkAll.addEventListener('click', () => this.markAllPresentToday());

    const btnCSV = document.getElementById('btnExportCSV');
    if (btnCSV) btnCSV.addEventListener('click', () => this.exportCSV());

    const btnPrint = document.getElementById('btnPrintReport');
    if (btnPrint) btnPrint.addEventListener('click', () => this.printReport());

    const btnImportExcel = document.getElementById('btnImportExcel');
    if (btnImportExcel) btnImportExcel.addEventListener('click', () => this.triggerExcelImport());

    const excelFileInput = document.getElementById('excelFileInput');
    if (excelFileInput) excelFileInput.addEventListener('change', (e) => this.handleExcelFileSelect(e));

    const btnCloseExcelModal = document.getElementById('btnCloseExcelModal');
    if (btnCloseExcelModal) btnCloseExcelModal.addEventListener('click', () => this.closeExcelModal());

    const btnCancelExcel = document.getElementById('btnCancelExcel');
    if (btnCancelExcel) btnCancelExcel.addEventListener('click', () => this.closeExcelModal());

    const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');
    if (btnDownloadTemplate) btnDownloadTemplate.addEventListener('click', () => this.downloadExcelTemplate());

    const btnConfirmExcelImport = document.getElementById('btnConfirmExcelImport');
    if (btnConfirmExcelImport) btnConfirmExcelImport.addEventListener('click', () => this.confirmExcelImport());

    const btnReset = document.getElementById('btnResetSampleData');
    if (btnReset) btnReset.addEventListener('click', () => this.resetSampleData());

    const btnTheme = document.getElementById('btnThemeToggle');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
      });
    }

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    // Mobile sidebar toggle
    const btnMobileMenu = document.getElementById('btnMobileMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.querySelector('.sidebar');

    if (btnMobileMenu && sidebar && sidebarOverlay) {
      btnMobileMenu.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
      });

      sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      });
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    this.elViewWeekly.style.display = tab === 'weekly' ? 'block' : 'none';
    this.elViewDaily.style.display = tab === 'daily' ? 'block' : 'none';
    this.elViewRoster.style.display = tab === 'roster' ? 'block' : 'none';
    this.elViewAnalytics.style.display = tab === 'analytics' ? 'block' : 'none';

    if (tab === 'weekly') this.renderWeeklyView();
    if (tab === 'daily') this.renderDailyView();
    if (tab === 'roster') this.renderRosterView();
    if (tab === 'analytics') this.renderAnalyticsView();
  }

  getCurrentClass() {
    return this.data.classes.find(c => c.id === this.data.activeClassId) || this.data.classes[0];
  }

  getClassStudents() {
    const cls = this.getCurrentClass();
    if (!cls) return [];
    return this.data.students.filter(s => s.classId === cls.id);
  }

  getDaysInActiveMonth() {
    return new Date(this.data.activeYear, this.data.activeMonth, 0).getDate();
  }

  getSchoolDaysInActiveMonth() {
    const daysCount = this.getDaysInActiveMonth();
    const days = [];
    for (let d = 1; d <= daysCount; d++) {
      const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
      if (dateObj.getDay() !== 0) {
        days.push(d);
      }
    }
    return days;
  }

  getAttendanceKey(shift = 'AM') {
    return `${this.data.activeClassId}_${this.data.activeYear}_${this.data.activeMonth}_${shift}`;
  }

  getAttendanceRecord(studentId, day, shift = 'AM') {
    const key = this.getAttendanceKey(shift);
    if (!this.data.attendance[key]) return 'NONE';
    return this.data.attendance[key][`${studentId}_${day}`] || 'NONE';
  }

  setAttendanceRecord(studentId, day, status, shift = 'AM') {
    const key = this.getAttendanceKey(shift);
    if (!this.data.attendance[key]) {
      this.data.attendance[key] = {};
    }
    this.data.attendance[key][`${studentId}_${day}`] = status;
    this.saveData();
  }

  cycleStatus(studentId, day, shift = 'AM') {
    const current = this.getAttendanceRecord(studentId, day, shift);
    const order = ['NONE', 'P', 'A', 'L'];
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    const nextStatus = order[nextIdx];
    this.setAttendanceRecord(studentId, day, nextStatus, shift);
    this.render();
    if (this.activeTab === 'weekly') this.renderWeeklyView();
  }

  setActiveSelectedStatus(status) {
    this.activeSelectedStatus = status;
    if (this.activeTab === 'weekly') this.renderWeeklyView();
    if (this.activeTab === 'daily') this.renderDailyView();
  }

  setSearch(query) {
    this.searchQuery = query.trim();
    if (this.activeTab === 'weekly') this.renderWeeklyView();
    if (this.activeTab === 'daily') this.renderDailyView();
  }

  onCellClick(studentId, day, shift = 'AM') {
    if (this.activeSelectedStatus === 'CYCLE') {
      this.cycleStatus(studentId, day, shift);
    } else {
      const current = this.getAttendanceRecord(studentId, day, shift);
      const newStatus = (current === this.activeSelectedStatus) ? 'NONE' : this.activeSelectedStatus;
      this.setAttendanceRecord(studentId, day, newStatus, shift);
      this.renderSummaryCards();
      this.renderWeeklyView();
    }
  }

  render() {
    this.renderClassList();
    this.renderHeaderInfo();
    this.renderSummaryCards();
    if (this.activeTab === 'weekly') this.renderWeeklyView();
    if (this.activeTab === 'daily') this.renderDailyView();
    if (this.activeTab === 'roster') this.renderRosterView();
    if (this.activeTab === 'analytics') this.renderAnalyticsView();
  }

  renderClassList() {
    const currentCls = this.getCurrentClass();
    if (!currentCls || !this.elClassList) return;

    this.elClassList.innerHTML = this.data.classes.map(cls => {
      const studentCount = this.data.students.filter(s => s.classId === cls.id).length;
      const isActive = cls.id === currentCls.id;
      return `
        <li class="nav-item ${isActive ? 'active' : ''}" onclick="app.selectClass('${cls.id}')">
          <i class="lucide-book-open"></i>
          <div>
            <div style="font-weight:600;">${cls.name}</div>
            <div style="font-size:0.7rem; opacity: 0.8;">ច័ន្ទ-សៅរ៍ (១ព្រឹក)</div>
          </div>
          <span class="class-badge-count">${studentCount}</span>
        </li>
      `;
    }).join('');
  }

  selectClass(classId) {
    this.data.activeClassId = classId;
    this.saveData();
    this.render();

    // Close mobile sidebar on class select
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  renderHeaderInfo() {
    const cls = this.getCurrentClass();
    if (cls && this.elCurrentClassName && this.elCurrentClassRoom) {
      this.elCurrentClassName.textContent = cls.name;
      this.elCurrentClassRoom.textContent = `${cls.room} | គ្រូបន្ទុក៖ ${cls.teacher} | កាលវិភាគ៖ ច័ន្ទ-សៅរ៍ (សៅរ៍ ១ ព្រឹក)`;
    }
  }

  renderSummaryCards() {
    const students = this.getClassStudents();
    const schoolDays = this.getSchoolDaysInActiveMonth();
    
    let pCount = 0, aCount = 0, lCount = 0;
    let totalPossibleSessions = 0;

    students.forEach(std => {
      schoolDays.forEach(day => {
        const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, day);
        const isSaturday = dateObj.getDay() === 6;
        const shifts = isSaturday ? ['AM'] : ['AM', 'PM'];

        shifts.forEach(shift => {
          totalPossibleSessions++;
          const status = this.getAttendanceRecord(std.id, day, shift);
          if (status === 'P') pCount++;
          if (status === 'A') aCount++;
          if (status === 'L') lCount++;
        });
      });
    });

    const rate = totalPossibleSessions > 0 ? Math.round((pCount / totalPossibleSessions) * 100) : 0;

    if (this.elTotalStudents) this.elTotalStudents.textContent = students.length;
    if (this.elTotalPresent) this.elTotalPresent.textContent = pCount;
    if (this.elTotalAbsent) this.elTotalAbsent.textContent = aCount + lCount;
    if (this.elTotalRate) this.elTotalRate.textContent = `${rate}%`;
  }

  renderWeeklyView() {
    const allStudents = this.getClassStudents();
    const filteredStudents = this.searchQuery
      ? allStudents.filter(s => s.name && s.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
      : allStudents;
    const students = filteredStudents;
    const daysCount = this.getDaysInActiveMonth();

    const weeks = [
      { name: "សប្តាហ៍ទី ១ (ថ្ងៃទី ១ - ៧)", start: 1, end: 7 },
      { name: "សប្តាហ៍ទី ២ (ថ្ងៃទី ៨ - ១៤)", start: 8, end: 14 },
      { name: "សប្តាហ៍ទី ៣ (ថ្ងៃទី ១៥ - ២១)", start: 15, end: 21 },
      { name: "សប្តាហ៍ទី ៤ (ថ្ងៃទី ២២ - ២៨)", start: 22, end: 28 },
      { name: `សប្តាហ៍ទី ៥ (ថ្ងៃទី ២៩ - ${daysCount})`, start: 29, end: daysCount }
    ];

    const currentWeek = weeks[this.selectedWeekIndex] || weeks[0];
    
    const weekDays = [];
    for (let d = currentWeek.start; d <= Math.min(currentWeek.end, daysCount); d++) {
      const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
      if (dateObj.getDay() !== 0) {
        weekDays.push(d);
      }
    }

    let weekOptions = weeks.map((w, idx) => 
      `<option value="${idx}" ${idx === this.selectedWeekIndex ? 'selected' : ''}>${w.name}</option>`
    ).join('');

    let headerDaysHtml = weekDays.map(d => {
      const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
      const dayOfWeekIndex = dateObj.getDay();
      const isSaturday = dayOfWeekIndex === 6;
      const isToday = (d === this.cambodiaTime.day && this.data.activeMonth === this.cambodiaTime.month && this.data.activeYear === this.cambodiaTime.year);
      const colSpan = isSaturday ? 1 : 2;

      return `<th colspan="${colSpan}" style="padding: 0.5rem; text-align: center; border-bottom: 1px solid var(--border-color); ${isSaturday ? 'background: rgba(245,158,11,0.08);' : ''} ${isToday ? 'background: rgba(5, 150, 105, 0.2) !important; color: var(--primary); font-weight:700;' : ''}">
        <div>${KHMER_DAYS[dayOfWeekIndex]} ${isToday ? '★' : ''}</div>
        <div style="font-size: 1rem; font-weight: 700;">${d}</div>
      </th>`;
    }).join('');

    let subShiftHeaderHtml = weekDays.map(d => {
      const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
      const isSaturday = dateObj.getDay() === 6;
      if (isSaturday) {
        return `<th style="font-size:0.7rem; color: var(--primary); background: var(--bg-main);">ព្រឹក</th>`;
      }
      return `<th style="font-size:0.7rem; color: var(--primary); background: var(--bg-main);">ព្រឹក</th>
              <th style="font-size:0.7rem; color: var(--secondary); background: var(--bg-main);">ល្ងាច</th>`;
    }).join('');

    let rowsHtml = students.map((std, i) => {
      let p = 0, a = 0, l = 0;

      let cells = weekDays.map(d => {
        const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
        const isSaturday = dateObj.getDay() === 6;

        const activeShifts = isSaturday ? ['AM'] : ['AM', 'PM'];

        return activeShifts.map(shift => {
          const status = this.getAttendanceRecord(std.id, d, shift);
          if (status === 'P') p++;
          if (status === 'A') a++;
          if (status === 'L') l++;

          return `<td style="text-align: center; padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--border-color);">
            <button class="status-cell-btn ${status}" onclick="app.onCellClick('${std.id}', ${d}, '${shift}')" style="width: 32px; height: 32px; font-size: 0.85rem;" title="${shift === 'AM' ? 'វេនព្រឹក' : 'វេនល្ងាច'}">
              ${status === 'NONE' ? '-' : status}
            </button>
          </td>`;
        }).join('');
      }).join('');

      const totalMarked = p + a + l;
      const ratePct = totalMarked > 0 ? Math.round((p / totalMarked) * 100) : 100;

      return `<tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.85rem 1rem; font-weight: 600;">${i + 1}</td>
        <td style="padding: 0.85rem 1rem; font-weight: 700;">${std.name}</td>
        ${cells}
      </tr>`;
    }).join('');

    this.elViewWeekly.innerHTML = `
      <div class="week-picker-box">
        <div class="week-picker-inner">
          <i class="lucide-calendar-days week-picker-icon"></i>
          <select id="weeklySelect" class="week-picker-select">
            ${weekOptions}
          </select>
          <i class="lucide-chevron-down week-picker-arrow"></i>
        </div>
      </div>

      <!-- Combined Search + Status Picker Toolbar -->
      <div class="search-bar-toolbar">
        <!-- Left: Search Input -->
        <div class="search-bar-inner">
          <i class="lucide-search search-bar-icon"></i>
          <input
            type="text"
            id="weeklySearchInput"
            class="search-bar-input"
            placeholder="ស្វែងរកឈ្មោះសិស្ស..."
            value="${this.searchQuery}"
            oninput="app.setSearch(this.value)"
            autocomplete="off"
          />
          ${this.searchQuery ? `<button class="search-bar-clear" onclick="app.setSearch('')" title="Clear">&times;</button>` : ''}
        </div>
        ${this.searchQuery
          ? `<span class="search-bar-result"><i class="lucide-filter" style="font-size:0.8rem;"></i> ស្វែងរករកឃើញ <strong>${filteredStudents.length}</strong> នាក់</span>`
          : `<span class="search-bar-hint"><i class="lucide-users" style="font-size:0.8rem;"></i> សិស្សសរុប <strong>${filteredStudents.length}</strong> នាក់</span>`
        }

        <!-- Divider -->
        <div class="toolbar-divider"></div>

        <!-- Right: Status Picker Buttons -->
        <div class="picker-buttons">
          <button class="picker-btn status-p ${this.activeSelectedStatus === 'P' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('P')"><span class="dot-badge green"></span> P (វត្តមាន)</button>
          <button class="picker-btn status-a ${this.activeSelectedStatus === 'A' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('A')"><span class="dot-badge red"></span> A (អវត្តមាន)</button>
          <button class="picker-btn status-l ${this.activeSelectedStatus === 'L' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('L')"><span class="dot-badge yellow"></span> L (ច្បាប់)</button>
          <button class="picker-btn status-none ${this.activeSelectedStatus === 'NONE' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('NONE')"><span class="dot-badge gray"></span> -</button>
          <button class="picker-btn status-cycle ${this.activeSelectedStatus === 'CYCLE' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('CYCLE')"><i class="lucide-refresh-cw"></i> ផ្លាស់ប្តូរ</button>
        </div>
      </div>

      <div style="background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); overflow-x: auto; box-shadow: var(--shadow-sm);">
        <table class="weekly-attendance-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--bg-main);">
              <th style="padding: 0.75rem 0.5rem; width: 45px;" rowspan="2">ល.រ</th>
              <th style="padding: 0.75rem 0.5rem; text-align: left; width: 180px;" rowspan="2">ឈ្មោះសិស្ស</th>
              ${headerDaysHtml}
            </tr>
            <tr>${subShiftHeaderHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="20" style="padding: 2rem; text-align: center; color: var(--text-muted);">គ្មានសិស្ស</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    const weeklySelect = document.getElementById('weeklySelect');
    if (weeklySelect) {
      weeklySelect.addEventListener('change', (e) => {
        this.selectedWeekIndex = parseInt(e.target.value);
        this.renderWeeklyView();
      });
    }
  }

  markAllPresentWeek(startDay, endDay) {
    const students = this.getClassStudents();
    students.forEach(std => {
      for(let d = startDay; d <= endDay; d++) {
        const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek !== 0) {
          this.setAttendanceRecord(std.id, d, 'P', 'AM');
          if (dayOfWeek !== 6) {
            this.setAttendanceRecord(std.id, d, 'P', 'PM');
          }
        }
      }
    });
    this.render();
    if (this.activeTab === 'weekly') this.renderWeeklyView();
    alert(`បានស្រង់វត្តមាន (P) គ្រប់គ្នាសម្រាប់ សប្តាហ៍នេះ រួចរាល់!`);
  }

  getStatusLabel(status) {
    switch(status) {
      case 'P': return 'វត្តមាន (Present)';
      case 'A': return 'អវត្តមាន (Absent)';
      case 'L': return 'ច្បាប់ (Leave)';
      default: return 'មិនទាន់ស្រង់';
    }
  }

  renderDailyView() {
    const allStudents = this.getClassStudents();
    const filteredStudents = this.searchQuery
      ? allStudents.filter(s => s.name && s.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
      : allStudents;
    const students = filteredStudents;
    const daysCount = this.getDaysInActiveMonth();
    
    let optionsHtml = '';
    for(let d = 1; d <= daysCount; d++) {
      const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
      if (dateObj.getDay() === 0) continue;
      const isToday = (d === this.cambodiaTime.day && this.data.activeMonth === this.cambodiaTime.month && this.data.activeYear === this.cambodiaTime.year);
      optionsHtml += `<option value="${d}" ${d === this.selectedDailyDate ? 'selected' : ''}>ថ្ងៃទី ${d} ${KHMER_MONTHS[this.data.activeMonth - 1]} (${KHMER_DAYS[dateObj.getDay()]}) ${isToday ? '(ថ្ងៃនេះ)' : ''}</option>`;
    }

    const selectedDateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, this.selectedDailyDate);
    const isSaturday = selectedDateObj.getDay() === 6;

    let rowsHtml = students.map((std, i) => {
      const statusAM = this.getAttendanceRecord(std.id, this.selectedDailyDate, 'AM');
      const statusPM = this.getAttendanceRecord(std.id, this.selectedDailyDate, 'PM');

      return `<tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.85rem 1rem; font-weight: 600;">${i + 1}</td>
        <td style="padding: 0.85rem 1rem; font-weight: 700;">${std.name}</td>
        <td style="text-align: center; padding: 0.5rem;">
          <button class="status-cell-btn ${statusAM}" onclick="app.onDailyCellClick('${std.id}', 'AM')" style="width: 38px; height: 38px; font-size: 0.95rem; font-weight: 700;" title="វេនព្រឹក">
            ${statusAM === 'NONE' ? '-' : statusAM}
          </button>
        </td>
        ${!isSaturday ? `
          <td style="text-align: center; padding: 0.5rem;">
            <button class="status-cell-btn ${statusPM}" onclick="app.onDailyCellClick('${std.id}', 'PM')" style="width: 38px; height: 38px; font-size: 0.95rem; font-weight: 700;" title="វេនល្ងាច">
              ${statusPM === 'NONE' ? '-' : statusPM}
            </button>
          </td>
        ` : ''}
      </tr>`;
    }).join('');

    this.elViewDaily.innerHTML = `
      <div class="week-picker-box">
        <div class="week-picker-inner">
          <i class="lucide-calendar week-picker-icon"></i>
          <select id="dailyDateSelect" class="week-picker-select">
            ${optionsHtml}
          </select>
          <i class="lucide-chevron-down week-picker-arrow"></i>
        </div>
      </div>

      <div class="search-bar-toolbar">
        <div class="search-bar-inner">
          <i class="lucide-search search-bar-icon"></i>
          <input
            type="text"
            id="dailySearchInput"
            class="search-bar-input"
            placeholder="ស្វែងរកឈ្មោះសិស្ស..."
            value="${this.searchQuery}"
            oninput="app.setSearch(this.value)"
            autocomplete="off"
          />
          ${this.searchQuery ? `<button class="search-bar-clear" onclick="app.setSearch('')" title="Clear">&times;</button>` : ''}
        </div>
        ${this.searchQuery
          ? `<span class="search-bar-result"><i class="lucide-filter" style="font-size:0.8rem;"></i> ស្វែងរករកឃើញ <strong>${filteredStudents.length}</strong> នាក់</span>`
          : `<span class="search-bar-hint"><i class="lucide-users" style="font-size:0.8rem;"></i> សិស្សសរុប <strong>${filteredStudents.length}</strong> នាក់</span>`
        }

        <div class="toolbar-divider"></div>

        <div class="picker-buttons">
          <button class="picker-btn status-p ${this.activeSelectedStatus === 'P' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('P')"><span class="dot-badge green"></span> P (វត្តមាន)</button>
          <button class="picker-btn status-a ${this.activeSelectedStatus === 'A' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('A')"><span class="dot-badge red"></span> A (អវត្តមាន)</button>
          <button class="picker-btn status-l ${this.activeSelectedStatus === 'L' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('L')"><span class="dot-badge yellow"></span> L (ច្បាប់)</button>
          <button class="picker-btn status-none ${this.activeSelectedStatus === 'NONE' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('NONE')"><span class="dot-badge gray"></span> -</button>
          <button class="picker-btn status-cycle ${this.activeSelectedStatus === 'CYCLE' ? 'selected' : ''}" onclick="app.setActiveSelectedStatus('CYCLE')"><i class="lucide-refresh-cw"></i> ផ្លាស់ប្តូរ</button>
        </div>
      </div>

      <div style="background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); overflow-x: auto; box-shadow: var(--shadow-sm);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--bg-main);">
              <th style="padding: 0.75rem 1rem; width: 50px;">ល.រ</th>
              <th style="padding: 0.75rem 1rem; text-align: left; width: 240px;">ឈ្មោះសិស្ស</th>
              <th style="padding: 0.75rem 1rem; text-align: center; color: var(--primary);">🌅 វេនព្រឹក (AM)</th>
              ${!isSaturday ? `<th style="padding: 0.75rem 1rem; text-align: center; color: var(--secondary);">🌇 វេនល្ងាច (PM)</th>` : ''}
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="8" style="padding: 2rem; text-align: center; color: var(--text-muted);">គ្មានសិស្ស</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    const dailyDateSelect = document.getElementById('dailyDateSelect');
    if (dailyDateSelect) {
      dailyDateSelect.addEventListener('change', (e) => {
        this.selectedDailyDate = parseInt(e.target.value);
        this.renderDailyView();
      });
    }
  }

  setDailyStatus(studentId, status, shift = 'AM') {
    const current = this.getAttendanceRecord(studentId, this.selectedDailyDate, shift);
    const newStatus = (current === status) ? 'NONE' : status;
    this.setAttendanceRecord(studentId, this.selectedDailyDate, newStatus, shift);
    this.renderSummaryCards();
    this.renderDailyView();
  }

  onDailyCellClick(studentId, shift = 'AM') {
    if (this.activeSelectedStatus === 'CYCLE') {
      const current = this.getAttendanceRecord(studentId, this.selectedDailyDate, shift);
      const order = ['NONE', 'P', 'A', 'L'];
      const nextIdx = (order.indexOf(current) + 1) % order.length;
      const nextStatus = order[nextIdx];
      this.setAttendanceRecord(studentId, this.selectedDailyDate, nextStatus, shift);
    } else {
      const current = this.getAttendanceRecord(studentId, this.selectedDailyDate, shift);
      const newStatus = (current === this.activeSelectedStatus) ? 'NONE' : this.activeSelectedStatus;
      this.setAttendanceRecord(studentId, this.selectedDailyDate, newStatus, shift);
    }
    this.renderSummaryCards();
    this.renderDailyView();
  }

  markAllPresentDaily(day) {
    const students = this.getClassStudents();
    const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, day);
    const isSaturday = dateObj.getDay() === 6;

    students.forEach(std => {
      this.setAttendanceRecord(std.id, day, 'P', 'AM');
      if (!isSaturday) {
        this.setAttendanceRecord(std.id, day, 'P', 'PM');
      }
    });
    this.render();
    if (this.activeTab === 'daily') this.renderDailyView();
  }

  markAllPresentToday() {
    const targetDay = this.cambodiaTime.day;
    const daysCount = this.getDaysInActiveMonth();
    const dayToMark = targetDay <= daysCount ? targetDay : 1;
    this.markAllPresentDaily(dayToMark);
    alert(`បានស្រង់វត្តមាន (P) គ្រប់គ្នាសម្រាប់ ថ្ងៃទី ${dayToMark} ${KHMER_MONTHS[this.data.activeMonth - 1]} ${this.data.activeYear} រួចរាល់!`);
  }

  renderRosterView() {
    const students = this.getClassStudents();
    this.elViewRoster.innerHTML = `
      <div style="background: var(--bg-card); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700;">បញ្ជីឈ្មោះសិស្សក្នុង ${this.getCurrentClass().name} (${students.length} នាក់)</h3>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" onclick="app.triggerExcelImport()">
            <i class="lucide-file-spreadsheet"></i> នាំចូល Excel (.xlsx)
          </button>
          <button class="btn btn-primary btn-sm" onclick="app.openAddStudentModal()">
            <i class="lucide-plus"></i> បន្ថែមសិស្សថ្មី
          </button>
        </div>
      </div>

      <div style="background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: var(--bg-main); border-bottom: 1px solid var(--border-color);">
              <th style="padding: 0.85rem 1rem;">ល.រ</th>
              <th style="padding: 0.85rem 1rem;">អត្តលេខ</th>
              <th style="padding: 0.85rem 1rem;">ឈ្មោះសិស្ស</th>
              <th style="padding: 0.85rem 1rem;">ភេទ</th>
              <th style="padding: 0.85rem 1rem;">លេខទូរស័ព្ទ</th>
              <th style="padding: 0.85rem 1rem; text-align: right;">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((std, i) => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.85rem 1rem;">${i + 1}</td>
                <td style="padding: 0.85rem 1rem; font-weight: 600;">${std.code}</td>
                <td style="padding: 0.85rem 1rem; font-weight: 700;">${std.name}</td>
                <td style="padding: 0.85rem 1rem;">${std.gender}</td>
                <td style="padding: 0.85rem 1rem;">${std.phone || '-'}</td>
                <td style="padding: 0.85rem 1rem; text-align: right;">
                  <button class="btn btn-secondary btn-sm" onclick="app.deleteStudent('${std.id}')" style="color: var(--status-a-text);">
                    លុប
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  openAddClassModal() {
    const name = prompt("បញ្ចូលឈ្មោះថ្នាក់រៀនថ្មី (ឧទាហរណ៍៖ ថ្នាក់ទី១២A):");
    if (!name) return;
    const room = prompt("បន្ទប់រៀន (ឧទាហរណ៍៖ បន្ទប់ ១០២):", "បន្ទប់ ១០១") || "បន្ទប់ ១០១";
    const teacher = prompt("ឈ្មោះគ្រូបន្ទុកថ្នាក់:", "លោកគ្រូ/អ្នកគ្រូ") || "លោកគ្រូ/អ្នកគ្រូ";

    const newClass = {
      id: `cls_${Date.now()}`,
      name,
      room,
      teacher,
      shift: "ច័ន្ទ-សៅរ៍ (សៅរ៍ ១ ព្រឹក)",
      subject: "ទូទៅ",
      academicYear: "2025-2026"
    };

    this.data.classes.push(newClass);
    this.data.activeClassId = newClass.id;
    this.saveData();
    this.render();
  }

  openAddStudentModal() {
    const name = prompt("បញ្ចូលឈ្មោះសិស្ស:");
    if (!name) return;
    const gender = prompt("ភេទ (ប្រុស / ស្រី):", "ប្រុស") || "ប្រុស";
    const code = prompt("អត្តលេខសិស្ស (ឧទាហរណ៍៖ STU-011):", `STU-${Math.floor(100 + Math.random() * 900)}`);
    const phone = prompt("លេខទូរស័ព្ទទំនាក់ទំនង:", "");

    const newStudent = {
      id: `std_${Date.now()}`,
      classId: this.data.activeClassId,
      code,
      name,
      gender,
      phone
    };

    this.data.students.push(newStudent);
    this.saveData();
    this.render();
    if (this.activeTab === 'roster') this.renderRosterView();
  }

  deleteStudent(id) {
    if (confirm("តើអ្នកពិតជាចង់លុបសិស្សនេះចេញពីបញ្ជីមែនទេ?")) {
      this.data.students = this.data.students.filter(s => s.id !== id);
      this.saveData();
      this.render();
      if (this.activeTab === 'roster') this.renderRosterView();
    }
  }

  renderAnalyticsView() {
    const students = this.getClassStudents();
    const schoolDays = this.getSchoolDaysInActiveMonth();

    let p = 0, a = 0, l = 0;
    students.forEach(std => {
      schoolDays.forEach(day => {
        const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, day);
        const isSaturday = dateObj.getDay() === 6;
        const shifts = isSaturday ? ['AM'] : ['AM', 'PM'];

        shifts.forEach(shift => {
          const st = this.getAttendanceRecord(std.id, day, shift);
          if (st === 'P') p++;
          if (st === 'A') a++;
          if (st === 'L') l++;
        });
      });
    });

    this.elViewAnalytics.innerHTML = `
      <div style="background: var(--bg-card); padding: 1rem 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-sm);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="lucide-pie-chart" style="font-size: 1.25rem; color: var(--primary);"></i>
          <h3 style="font-size: 1.15rem; font-weight: 700;">របាយការណ៍ និង ស្ថិតិវត្តមាន</h3>
        </div>
        <button class="btn btn-primary btn-sm" onclick="app.downloadAnalyticsAsJPEG()">
          <i class="lucide-image"></i> ទាញយកជារូបភាព (Download JPEG)
        </button>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3 style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700;">សរុបវត្តមានប្រចាំខែ ${KHMER_MONTHS[this.data.activeMonth - 1]} (ច័ន្ទ-សៅរ៍ ១ ព្រឹក)</h3>
          <div style="max-width: 320px; margin: 0 auto;">
            <canvas id="attendanceDoughnutChart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3 style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700;">អវត្តមាន</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem;">
            ${this.getLowAttendanceStudents().map(item => `
              <li style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: var(--bg-main); border-radius: var(--radius-md);">
                <strong style="font-size: 1rem;">${item.student.name}</strong>
                <div style="display: flex; gap: 0.4rem; align-items: center;">
                  ${item.absentCount > 0 ? `<span class="status-cell-btn A" style="width: 32px; height: 32px; font-size: 0.85rem; font-weight: 700; cursor: default; display: inline-flex; align-items: center; justify-content: center;" title="អវត្តមាន ${item.absentCount} លើក">A</span>` : ''}
                  ${item.leaveCount > 0 ? `<span class="status-cell-btn L" style="width: 32px; height: 32px; font-size: 0.85rem; font-weight: 700; cursor: default; display: inline-flex; align-items: center; justify-content: center;" title="ច្បាប់ ${item.leaveCount} លើក">L</span>` : ''}
                </div>
              </li>
            `).join('') || '<li style="color: var(--text-muted);">គ្មានសិស្សអវត្តមាន ឬ សុំច្បាប់ទេ! 👍</li>'}
          </ul>
        </div>
      </div>
    `;

    setTimeout(() => {
      const ctx = document.getElementById('attendanceDoughnutChart');
      if (ctx) {
        if (this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['វត្តមាន (P)', 'អវត្តមាន (A)', 'ច្បាប់ (L)'],
            datasets: [{
              data: [p, a, l],
              backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
            }]
          },
          options: { responsive: true, maintainAspectRatio: true }
        });
      }
    }, 100);
  }

  clearStudentAbsences(studentId) {
    const std = this.data.students.find(s => s.id === studentId || s.code === studentId);
    if (!std) return;

    let clearedCount = 0;
    Object.keys(this.data.attendance).forEach(key => {
      Object.keys(this.data.attendance[key]).forEach(recKey => {
        if (recKey.startsWith(`${std.id}_`) && this.data.attendance[key][recKey] === 'A') {
          this.data.attendance[key][recKey] = 'P';
          clearedCount++;
        }
      });
    });

    this.saveData();
    this.render();
    if (this.activeTab === 'analytics') this.renderAnalyticsView();

    alert(`បានលុបអវត្តមានសម្រាប់សិស្ស ${std.name} (${std.code}) រួចរាល់!`);
  }

  getLowAttendanceStudents() {
    const students = this.getClassStudents();
    const schoolDays = this.getSchoolDaysInActiveMonth();
    const result = [];

    students.forEach(std => {
      let absentCount = 0;
      let leaveCount = 0;
      schoolDays.forEach(d => {
        const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
        const isSaturday = dateObj.getDay() === 6;
        const shifts = isSaturday ? ['AM'] : ['AM', 'PM'];

        shifts.forEach(shift => {
          const st = this.getAttendanceRecord(std.id, d, shift);
          if (st === 'A') absentCount++;
          if (st === 'L') leaveCount++;
        });
      });
      if (absentCount > 0 || leaveCount > 0) {
        result.push({ student: std, absentCount, leaveCount });
      }
    });

    return result.sort((a, b) => (b.absentCount + b.leaveCount) - (a.absentCount + a.leaveCount));
  }

  downloadAnalyticsAsJPEG() {
    const cls = this.getCurrentClass();
    const ct = this.getCambodiaTime();

    // Khmer date info
    const khmerMonths = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា',
      'កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
    const khmerDays = ['អាទិត្យ','ច័ន្ទ','អង្គារ','ពុធ','ព្រហស្បតិ៍','សុក្រ','សៅរ៍'];
    const now = new Date();
    const dayName = khmerDays[now.getDay()];
    const dayNum  = now.getDate();
    const monthName = khmerMonths[now.getMonth()];
    const year = now.getFullYear();
    const hour = now.getHours();
    const minuteStr = String(now.getMinutes()).padStart(2, '0');
    const session = hour < 12 ? 'វេនព្រឹក (AM)' : 'វេនល្ងាច (PM)';
    const timeStr = `${hour}:${minuteStr}`;
    const isDark = document.body.getAttribute('data-theme') === 'dark';

    // Build absent list HTML
    const absentItems = this.getLowAttendanceStudents();
    const absentListHtml = absentItems.length === 0
      ? `<p style="color:#94a3b8; font-size:0.95rem; padding: 1rem 0;">គ្មានសិស្សអវត្តមាន ឬ សុំច្បាប់ទេ! 👍</p>`
      : absentItems.map((item, i) => `
          <div style="
            display:flex; align-items:center; justify-content:space-between;
            padding: 0.85rem 1.1rem;
            background:${isDark ? '#1a2d4a' : '#f1f5f9'};
            border-radius: 10px;
            margin-bottom: 0.6rem;
            border: 1px solid ${isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0'};
          ">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span style="
                width:28px; height:28px; border-radius:50%;
                background:${isDark ? '#0f2744' : '#cbd5e1'};
                display:flex; align-items:center; justify-content:center;
                font-size:0.78rem; font-weight:700; color:${isDark ? '#94a3b8':'#475569'};
              ">${i + 1}</span>
              <span style="font-size:1rem; font-weight:700; color:${isDark ? '#f1f5f9':'#0f172a'};">${item.student.name}</span>
            </div>
            <div style="display:flex; gap:0.4rem;">
              ${item.absentCount > 0 ? `<span style="
                width:34px; height:34px; border-radius:8px;
                background:rgba(239,68,68,0.15); color:#ef4444;
                border: 1.5px solid rgba(239,68,68,0.4);
                display:inline-flex; align-items:center; justify-content:center;
                font-size:0.9rem; font-weight:800;
              ">A</span>` : ''}
              ${item.leaveCount > 0 ? `<span style="
                width:34px; height:34px; border-radius:8px;
                background:rgba(245,158,11,0.15); color:#f59e0b;
                border: 1.5px solid rgba(245,158,11,0.4);
                display:inline-flex; align-items:center; justify-content:center;
                font-size:0.9rem; font-weight:800;
              ">L</span>` : ''}
            </div>
          </div>
        `).join('');

    // Create the off-screen card for capture
    const card = document.createElement('div');
    card.style.cssText = `
      position: fixed; top: -9999px; left: -9999px;
      width: 520px;
      background: ${isDark ? '#0f2744' : '#ffffff'};
      border-radius: 16px;
      padding: 28px;
      font-family: 'Kantumruy Pro', 'Noto Sans Khmer', sans-serif;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      border: 1px solid ${isDark ? 'rgba(148,163,184,0.15)' : '#e2e8f0'};
    `;
    card.innerHTML = `
      <!-- Gradient top accent -->
      <div style="height:4px; border-radius:4px; background:linear-gradient(90deg,#10b981,#6366f1); margin-bottom:22px;"></div>

      <!-- Header: Class + School info -->
      <div style="margin-bottom: 18px;">
        <div style="font-size:1.3rem; font-weight:800; color:${isDark?'#f1f5f9':'#0f172a'}; line-height:1.3;">${cls ? cls.name : 'ថ្នាក់'}</div>
        ${cls && cls.room ? `<div style="font-size:0.82rem; color:${isDark?'#94a3b8':'#64748b'}; margin-top:2px;">${cls.room}</div>` : ''}
      </div>

      <!-- Date + Session badge row -->
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
        <div style="
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.25);
          border-radius:50px; padding: 7px 16px;
        ">
          <span style="font-size:1rem;">📅</span>
          <span style="font-size:0.9rem; font-weight:700; color:#10b981;">
            ${dayName} ថ្ងៃទី ${dayNum} ${monthName} ${year}
          </span>
        </div>
        <div style="
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.25);
          border-radius:50px; padding: 7px 16px;
        ">
          <span style="font-size:1rem;">${hour < 12 ? '🌅' : '🌇'}</span>
          <span style="font-size:0.9rem; font-weight:700; color:#818cf8;">${session}</span>
        </div>
      </div>

      <!-- Section title -->
      <div style="
        font-size:1.05rem; font-weight:700;
        color:${isDark?'#f1f5f9':'#0f172a'};
        margin-bottom: 14px;
        display:flex; align-items:center; gap:8px;
      ">
        <span style="font-size:1.1rem;">🔴</span> បញ្ជីអវត្តមាន
        <span style="
          background:rgba(239,68,68,0.15); color:#ef4444;
          border-radius:50px; padding:2px 10px; font-size:0.78rem; font-weight:800;
        ">${absentItems.length} នាក់</span>
      </div>

      <!-- Absent list -->
      <div>${absentListHtml}</div>
    `;

    document.body.appendChild(card);

    const safeFileName = `Absent_${cls ? cls.name.replace(/\s+/g,'_') : 'Class'}_${dayNum}_${now.getMonth()+1}_${year}_${hour < 12 ? 'AM' : 'PM'}.jpg`;

    if (typeof html2canvas !== 'undefined') {
      html2canvas(card, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: isDark ? '#0f2744' : '#ffffff',
        logging: false
      }).then(canvas => {
        document.body.removeChild(card);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = safeFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/jpeg', 0.97);
      }).catch(err => {
        document.body.removeChild(card);
        console.error("html2canvas export error:", err);
        this.fallbackChartExport();
      });
    } else {
      document.body.removeChild(card);
      this.fallbackChartExport();
    }
  }

  fallbackChartExport() {
    const chartCanvas = document.getElementById('attendanceDoughnutChart');
    if (chartCanvas) {
      chartCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Analytics_Chart_Grade12_${this.data.activeMonth}_${this.data.activeYear}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/jpeg', 0.95);
    }
  }

  exportCSV() {
    const cls = this.getCurrentClass();
    const students = this.getClassStudents();
    const schoolDays = this.getSchoolDaysInActiveMonth();

    let csvContent = "\uFEFF";
    csvContent += `តារាងស្រង់វត្តមាន (ច័ន្ទ-សៅរ៍ ១ ព្រឹក) - ${cls.name}\n`;
    csvContent += `ខែ/ឆ្នាំ:,${KHMER_MONTHS[this.data.activeMonth - 1]} ${this.data.activeYear}\n\n`;

    let headers = ["ល.រ", "អត្តលេខ", "ឈ្មោះសិស្ស", "ភេទ"];
    schoolDays.forEach(d => {
      const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
      if (dateObj.getDay() === 6) {
        headers.push(`ថ្ងៃ${d}_សៅរ៍_ព្រឹក`);
      } else {
        headers.push(`ថ្ងៃ${d}_ព្រឹក`, `ថ្ងៃ${d}_ល្ងាច`);
      }
    });
    headers.push("វត្តមាន (P)", "អវត្តមាន (A)", "ច្បាប់ (L)", "ភាគរយ (%)");
    csvContent += headers.join(",") + "\n";

    students.forEach((std, index) => {
      let p = 0, a = 0, l = 0;
      let row = [`${index + 1}`, `"${std.code}"`, `"${std.name}"`, `"${std.gender}"`];

      schoolDays.forEach(day => {
        const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, day);
        const isSaturday = dateObj.getDay() === 6;
        const shifts = isSaturday ? ['AM'] : ['AM', 'PM'];

        shifts.forEach(shift => {
          const st = this.getAttendanceRecord(std.id, day, shift);
          if (st === 'P') p++;
          if (st === 'A') a++;
          if (st === 'L') l++;
          row.push(st === 'NONE' ? '-' : st);
        });
      });

      const totalMarked = p + a + l;
      const ratePct = totalMarked > 0 ? Math.round((p / totalMarked) * 100) : 100;

      row.push(p, a, l, `${ratePct}%`);
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_${cls.name}_${this.data.activeMonth}_${this.data.activeYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printReport() {
    const cls = this.getCurrentClass();
    const students = this.getClassStudents();
    const schoolDays = this.getSchoolDaysInActiveMonth();
    const printArea = document.getElementById('printReportArea');

    let tableHtml = `<table class="print-table">
      <thead>
        <tr>
          <th rowspan="2">ល.រ</th>
          <th rowspan="2">អត្តលេខ</th>
          <th rowspan="2">ឈ្មោះសិស្ស</th>
          <th rowspan="2">ភេទ</th>`;

    schoolDays.forEach(d => {
      const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
      const isSaturday = dateObj.getDay() === 6;
      tableHtml += `<th colspan="${isSaturday ? 1 : 2}">${d} (${KHMER_DAYS[dateObj.getDay()]})</th>`;
    });

    tableHtml += `<th rowspan="2">P</th><th rowspan="2">A</th><th rowspan="2">L</th><th rowspan="2">%</th></tr><tr>`;

    schoolDays.forEach(d => {
      const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
      const isSaturday = dateObj.getDay() === 6;
      if (isSaturday) {
        tableHtml += `<th>ព្រ</th>`;
      } else {
        tableHtml += `<th>ព្រ</th><th>ល្ង</th>`;
      }
    });

    tableHtml += `</tr></thead><tbody>`;

    students.forEach((std, idx) => {
      let p = 0, a = 0, l = 0;
      tableHtml += `<tr>
        <td>${idx + 1}</td>
        <td>${std.code}</td>
        <td style="text-align: left; padding-left: 4px;">${std.name}</td>
        <td>${std.gender}</td>`;

      schoolDays.forEach(d => {
        const dateObj = new Date(this.data.activeYear, this.data.activeMonth - 1, d);
        const isSaturday = dateObj.getDay() === 6;
        const shifts = isSaturday ? ['AM'] : ['AM', 'PM'];

        shifts.forEach(shift => {
          const st = this.getAttendanceRecord(std.id, d, shift);
          if (st === 'P') p++;
          if (st === 'A') a++;
          if (st === 'L') l++;
          tableHtml += `<td>${st === 'NONE' ? '-' : st}</td>`;
        });
      });

      const totalMarked = p + a + l;
      const ratePct = totalMarked > 0 ? Math.round((p / totalMarked) * 100) : 100;

      tableHtml += `<td>${p}</td><td>${a}</td><td>${l}</td><td>${ratePct}%</td></tr>`;
    });

    tableHtml += `</tbody></table>`;

    printArea.innerHTML = `
      <div class="print-header">
        <h2>ព្រះរាជាណាចក្រកម្ពុជា • ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
        <h3>តារាងស្រង់វត្តមានសិស្ស (ច័ន្ទ - សៅរ៍ ១ ព្រឹក)</h3>
      </div>
      <div class="print-meta-grid">
        <div><strong>ថ្នាក់រៀន៖</strong> ${cls.name}</div>
        <div><strong>បន្ទប់៖</strong> ${cls.room}</div>
        <div><strong>ខែ/ឆ្នាំ៖</strong> ${KHMER_MONTHS[this.data.activeMonth - 1]} ${this.data.activeYear}</div>
        <div><strong>គ្រូបន្ទុកថ្នាក់៖</strong> ${cls.teacher}</div>
        <div><strong>កាលវិភាគ៖</strong> ច័ន្ទ-សៅរ៍ (សៅរ៍ ១ ព្រឹក)</div>
        <div><strong>ឆ្នាំសិក្សា៖</strong> ${cls.academicYear}</div>
      </div>
      ${tableHtml}
      <div class="print-signatures">
        <div class="signature-box">
          <p>បានឃើញ និងឯកភាព</p>
          <p><strong>នាយកសាលា</strong></p>
          <br><br><br>
        </div>
        <div class="signature-box">
          <p>ថ្ងៃទី.......ខែ.......ឆ្នាំ ២០....</p>
          <p><strong>គ្រូបន្ទុកថ្នាក់</strong></p>
          <br><br><br>
          <p>${cls.teacher}</p>
        </div>
      </div>
    `;

    window.print();
  }

  resetSampleData() {
    if (confirm("តើអ្នកពិតជាចង់កំណត់ទិន្នន័យស្រង់វត្តមានទាំងអស់ឡើងវិញស្មើ ០ មែនទេ?")) {
      this.data.attendance = {};
      localStorage.setItem('TEACHER_ATTENDANCE_DATA', JSON.stringify(this.data));
      this.render();
      alert("បានកំណត់ទិន្នន័យឡើងវិញស្មើ ០ ដោយជោគជ័យ!");
    }
  }

  triggerExcelImport() {
    const input = document.getElementById('excelFileInput');
    if (input) {
      input.value = '';
      input.click();
    }
  }

  openExcelModal() {
    const modal = document.getElementById('excelModal');
    if (modal) modal.classList.add('active');
  }

  closeExcelModal() {
    const modal = document.getElementById('excelModal');
    if (modal) modal.classList.remove('active');
    this.pendingExcelStudents = [];
  }

  handleExcelFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      alert("កំពុងទាញយកបណ្ណាល័យ Excel (XLSX Library)... សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          alert("ពុំមានទិន្នន័យក្នុង File Excel នេះទេ!");
          return;
        }

        const parsedStudents = [];
        rawJson.forEach((row, index) => {
          let name = "", code = "", gender = "", phone = "";

          Object.keys(row).forEach(key => {
            const cleanKey = key.toString().trim().toLowerCase();
            const val = row[key].toString().trim();

            if (cleanKey.includes('ឈ្មោះ') || cleanKey.includes('name')) {
              name = val;
            } else if (cleanKey.includes('អត្តលេខ') || cleanKey.includes('code') || cleanKey.includes('id')) {
              code = val;
            } else if (cleanKey.includes('ភេទ') || cleanKey.includes('gender') || cleanKey.includes('sex')) {
              gender = val;
            } else if (cleanKey.includes('ទូរស័ព្ទ') || cleanKey.includes('phone') || cleanKey.includes('tel') || cleanKey.includes('contact')) {
              phone = val;
            }
          });

          if (!name) {
            const firstProp = Object.values(row).find(v => v && typeof v === 'string' && v.trim().length > 0);
            if (firstProp) name = firstProp.toString().trim();
          }

          if (name) {
            if (!code) code = `STU-${Math.floor(100 + Math.random() * 900)}`;
            if (!gender) gender = "ប្រុស";

            parsedStudents.push({
              id: `std_imp_${Date.now()}_${index}`,
              classId: this.data.activeClassId,
              code,
              name,
              gender,
              phone
            });
          }
        });

        if (parsedStudents.length === 0) {
          alert("មិនអាចអានឈ្មោះសិស្សចេញពី File Excel នេះបានទេ។ សូមពិនិត្យមើលក្បាលជួរឈរ (Headers)!");
          return;
        }

        this.pendingExcelStudents = parsedStudents;
        this.renderExcelPreview();
        this.openExcelModal();

      } catch (err) {
        console.error("Error reading Excel file:", err);
        alert("មានបញ្ហាក្នុងការអាន File Excel នេះ៖ " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  renderExcelPreview() {
    const elContainer = document.getElementById('excelPreviewContainer');
    const elBody = document.getElementById('excelPreviewBody');
    const elCount = document.getElementById('parsedStudentCount');
    const elTargetClass = document.getElementById('targetClassNameText');
    const btnConfirm = document.getElementById('btnConfirmExcelImport');

    const currentCls = this.getCurrentClass();
    if (elTargetClass) elTargetClass.textContent = `នាំចូលទៅ៖ ${currentCls.name}`;
    if (elCount) elCount.textContent = this.pendingExcelStudents.length;

    if (elBody) {
      elBody.innerHTML = this.pendingExcelStudents.map((std, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${std.code}</strong></td>
          <td><strong>${std.name}</strong></td>
          <td>${std.gender}</td>
          <td>${std.phone || '-'}</td>
        </tr>
      `).join('');
    }

    if (elContainer) elContainer.style.display = 'block';
    if (btnConfirm) btnConfirm.disabled = false;
  }

  confirmExcelImport() {
    if (!this.pendingExcelStudents || this.pendingExcelStudents.length === 0) return;

    this.data.students.push(...this.pendingExcelStudents);
    this.saveData();
    this.render();

    const count = this.pendingExcelStudents.length;
    this.closeExcelModal();

    alert(`បាននាំចូលសិស្សចំនួន ${count} នាក់ទៅក្នុង ${this.getCurrentClass().name} ដោយជោគជ័យ! 🎉`);
  }

  downloadExcelTemplate() {
    if (typeof XLSX === 'undefined') {
      alert("កំពុងទាញយកបណ្ណាល័យ Excel... សូមព្យាយាមម្តងទៀត!");
      return;
    }

    const templateData = [
      ["អត្តលេខ (Code)", "ឈ្មោះសិស្ស (Name)", "ភេទ (Gender)", "លេខទូរស័ព្ទ (Phone)"],
      ["STU-001", "សុខ មករា", "ប្រុស", "012 345 678"],
      ["STU-002", "ចាន់ សុភ័ក្រ", "ស្រី", "098 765 432"],
      ["STU-003", "គង់ វិចិត្រ", "ប្រុស", "010 112 233"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "បញ្ជីឈ្មោះសិស្ស");

    XLSX.writeFile(wb, "Student_List_Template.xlsx");
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new AttendanceApp();
});
