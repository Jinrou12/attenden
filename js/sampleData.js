/**
 * Sample Data for Teacher Multi-Class Monthly Student Attendance System
 * Supports Morning (ព្រឹក - AM) and Afternoon (ល្ងាច - PM) Sessions
 */
const DEFAULT_SAMPLE_DATA = {
  activeClassId: "cls_12_chun_nath",
  activeYear: 2026,
  activeMonth: 8, // August
  activeShift: "AM",
  classes: [
    {
      id: "cls_12_chun_nath",
      name: "ថ្នាក់ទី១២ (សម្តេច ជុន ណាត)",
      room: "បន្ទប់ ៤០៤",
      teacher: "លោក អ៊ុច ពិសិដ្ឋ",
      subject: "មធ្យមសិក្សាទុតិយភូមិ",
      shift: "ច័ន្ទ-សៅរ៍ (សៅរ៍ ១ ព្រឹក)",
      academicYear: "2026-2027"
    },
    {
      id: "cls_10a",
      name: "ថ្នាក់ទី ១០ A (10A)",
      room: "បន្ទប់ ២០១",
      teacher: "លោកគ្រូ សុខ ចាន់ថា",
      subject: "គណិតវិទ្យា",
      shift: "ព្រឹក",
      academicYear: "2025-2026"
    },
    {
      id: "cls_11b",
      name: "ថ្នាក់ទី ១១ B (11B)",
      room: "បន្ទប់ ៣០៤",
      teacher: "អ្នកគ្រូ កែវ ផល្លា",
      subject: "រូបវិទ្យា",
      shift: "ល្ងាច",
      academicYear: "2025-2026"
    },
    {
      id: "cls_eng_l3",
      name: "ថ្នាក់ភាសាអង់គ្លេស Level 3",
      room: "បន្ទប់ Lab 1",
      teacher: "លោកគ្រូ ហេង វិសាល",
      subject: "English Communication",
      shift: "ល្ងាច",
      academicYear: "2025-2026"
    }
  ],
  students: [
    // ថ្នាក់ទី១២ (សម្តេច ជុន ណាត) - 43 សិស្ស (ពិតប្រាកដពី F:\១.xlsx)
    { id: "std_401", classId: "cls_12_chun_nath", code: "STU-001", name: "ឡុញ ចន្ទបុត្រ", gender: "ប្រុស", phone: "" },
    { id: "std_402", classId: "cls_12_chun_nath", code: "STU-002", name: "វិន ឈាងលី", gender: "ប្រុស", phone: "" },
    { id: "std_403", classId: "cls_12_chun_nath", code: "STU-003", name: "យិន លីហ្សា", gender: "ប្រុស", phone: "" },
    { id: "std_404", classId: "cls_12_chun_nath", code: "STU-004", name: "គាត តុលា", gender: "ប្រុស", phone: "" },
    { id: "std_405", classId: "cls_12_chun_nath", code: "STU-005", name: "ឌិត ឃុនឡេង", gender: "ប្រុស", phone: "" },
    { id: "std_406", classId: "cls_12_chun_nath", code: "STU-006", name: "រិត យូសេង", gender: "ប្រុស", phone: "" },
    { id: "std_407", classId: "cls_12_chun_nath", code: "STU-007", name: "គួន សុកគីន", gender: "ប្រុស", phone: "" },
    { id: "std_408", classId: "cls_12_chun_nath", code: "STU-008", name: "នឿន វ៉ាន់ដេត", gender: "ប្រុស", phone: "" },
    { id: "std_409", classId: "cls_12_chun_nath", code: "STU-009", name: "សាត សុធារិទ្ធ", gender: "ប្រុស", phone: "" },
    { id: "std_410", classId: "cls_12_chun_nath", code: "STU-010", name: "អេង ប៊ុនលី", gender: "ប្រុស", phone: "" },
    { id: "std_411", classId: "cls_12_chun_nath", code: "STU-011", name: "សល់ រស្មី", gender: "ប្រុស", phone: "" },
    { id: "std_412", classId: "cls_12_chun_nath", code: "STU-012", name: "សុខ ចាន់ណា", gender: "ប្រុស", phone: "" },
    { id: "std_413", classId: "cls_12_chun_nath", code: "STU-013", name: "ធី ពិសិដ្ឋ", gender: "ប្រុស", phone: "" },
    { id: "std_414", classId: "cls_12_chun_nath", code: "STU-014", name: "ម៉េន ពន្លក", gender: "ប្រុស", phone: "" },
    { id: "std_415", classId: "cls_12_chun_nath", code: "STU-015", name: "អឿន ឆារ៉ាន់់", gender: "ប្រុស", phone: "" },
    { id: "std_416", classId: "cls_12_chun_nath", code: "STU-016", name: "រឿន ម៉េងលាង", gender: "ប្រុស", phone: "" },
    { id: "std_417", classId: "cls_12_chun_nath", code: "STU-017", name: "ផល្លី ចាន់ឌី", gender: "ប្រុស", phone: "" },
    { id: "std_418", classId: "cls_12_chun_nath", code: "STU-018", name: "វន់ ដាវិត", gender: "ប្រុស", phone: "" },
    { id: "std_419", classId: "cls_12_chun_nath", code: "STU-019", name: "ស៊ុយ មេងលាង", gender: "ប្រុស", phone: "" },
    { id: "std_420", classId: "cls_12_chun_nath", code: "STU-020", name: "កាន គឹមហ័ង", gender: "ប្រុស", phone: "" },
    { id: "std_421", classId: "cls_12_chun_nath", code: "STU-021", name: "អ៊ុម កៅអង់", gender: "ប្រុស", phone: "" },
    { id: "std_422", classId: "cls_12_chun_nath", code: "STU-022", name: "អ៊ុត ខាត់នី", gender: "ប្រុស", phone: "" },
    { id: "std_423", classId: "cls_12_chun_nath", code: "STU-023", name: "ភិន ម៊ីុ", gender: "ប្រុស", phone: "" },
    { id: "std_424", classId: "cls_12_chun_nath", code: "STU-024", name: "រីម សុផានិត", gender: "ប្រុស", phone: "" },
    { id: "std_425", classId: "cls_12_chun_nath", code: "STU-025", name: "ហៀង ដាលីន", gender: "ប្រុស", phone: "" },
    { id: "std_426", classId: "cls_12_chun_nath", code: "STU-026", name: "សន សីលា", gender: "ប្រុស", phone: "" },
    { id: "std_427", classId: "cls_12_chun_nath", code: "STU-027", name: "នឿន វ៉ាន់រ៉េត", gender: "ប្រុស", phone: "" },
    { id: "std_428", classId: "cls_12_chun_nath", code: "STU-028", name: "ហ៊ន ហាប់", gender: "ប្រុស", phone: "" },
    { id: "std_429", classId: "cls_12_chun_nath", code: "STU-029", name: "ទូច ពិសី", gender: "ប្រុស", phone: "" },
    { id: "std_430", classId: "cls_12_chun_nath", code: "STU-030", name: "ផាត ម៉េងហ៊ាង", gender: "ប្រុស", phone: "" },
    { id: "std_431", classId: "cls_12_chun_nath", code: "STU-031", name: "សាំង ស៊ាន់", gender: "ប្រុស", phone: "" },
    { id: "std_432", classId: "cls_12_chun_nath", code: "STU-032", name: "ថែ អាល់", gender: "ប្រុស", phone: "" },
    { id: "std_433", classId: "cls_12_chun_nath", code: "STU-033", name: "ភឿន ប៊ុនថាវ", gender: "ប្រុស", phone: "" },
    { id: "std_434", classId: "cls_12_chun_nath", code: "STU-034", name: "កយ ហួត", gender: "ប្រុស", phone: "" },
    { id: "std_435", classId: "cls_12_chun_nath", code: "STU-035", name: "ថន ប៊ុនធូ", gender: "ប្រុស", phone: "" },
    { id: "std_436", classId: "cls_12_chun_nath", code: "STU-036", name: "អ៊ុល ឆៃអែង", gender: "ប្រុស", phone: "" },
    { id: "std_437", classId: "cls_12_chun_nath", code: "STU-037", name: "ភាព តារ៉ា", gender: "ប្រុស", phone: "" },
    { id: "std_438", classId: "cls_12_chun_nath", code: "STU-038", name: "ចឺម រតនា", gender: "ប្រុស", phone: "" },
    { id: "std_439", classId: "cls_12_chun_nath", code: "STU-039", name: "តូ ឡុងហេង", gender: "ប្រុស", phone: "" },
    { id: "std_440", classId: "cls_12_chun_nath", code: "STU-040", name: "ធឿន រក្សា", gender: "ប្រុស", phone: "" },
    { id: "std_441", classId: "cls_12_chun_nath", code: "STU-041", name: "ភាក់ សុផល", gender: "ប្រុស", phone: "" },
    { id: "std_442", classId: "cls_12_chun_nath", code: "STU-042", name: "ចាន់រ៉ា សុចិត្រា", gender: "ប្រុស", phone: "" },
    { id: "std_443", classId: "cls_12_chun_nath", code: "STU-043", name: "ថុន វិសាល", gender: "ប្រុស", phone: "" },

    // ថ្នាក់ទី ១០ A
    { id: "std_101", classId: "cls_10a", code: "STU-001", name: "សុខ មករា", gender: "ប្រុស", phone: "012 345 678" },
    { id: "std_102", classId: "cls_10a", code: "STU-002", name: "ចាន់ សុភ័ក្រ", gender: "ស្រី", phone: "098 765 432" },
    { id: "std_103", classId: "cls_10a", code: "STU-003", name: "គង់ វិចិត្រ", gender: "ប្រុស", phone: "010 112 233" },
    { id: "std_104", classId: "cls_10a", code: "STU-004", name: "ឡុង ស្រីណែត", gender: "ស្រី", phone: "077 889 900" },
    { id: "std_105", classId: "cls_10a", code: "STU-005", name: "ជា រតនៈ", gender: "ប្រុស", phone: "089 223 344" },
    { id: "std_106", classId: "cls_10a", code: "STU-006", name: "ប៉ែន គឹមហុង", gender: "ស្រី", phone: "015 667 788" },
    { id: "std_107", classId: "cls_10a", code: "STU-007", name: "អ៊ឹម សម្បត្តិ", gender: "ប្រុស", phone: "092 445 566" },
    { id: "std_108", classId: "cls_10a", code: "STU-008", name: "លី ស្រីលក្ខណ៍", gender: "ស្រី", phone: "088 112 244" },
    { id: "std_109", classId: "cls_10a", code: "STU-009", name: "ម៉េង ដាវីត", gender: "ប្រុស", phone: "096 554 433" },
    { id: "std_110", classId: "cls_10a", code: "STU-010", name: "វ៉ាន់ ធីតា", gender: "ស្រី", phone: "011 998 877" },

    // ថ្នាក់ទី ១១ B
    { id: "std_201", classId: "cls_11b", code: "STU-101", name: "សឿន ប៊ុនថន", gender: "ប្រុស", phone: "012 999 111" },
    { id: "std_202", classId: "cls_11b", code: "STU-102", name: "នួន សុខា", gender: "ស្រី", phone: "093 888 222" },
    { id: "std_203", classId: "cls_11b", code: "STU-103", name: "ហេង សម្ផស្ស", gender: "ស្រី", phone: "078 777 333" },
    { id: "std_204", classId: "cls_11b", code: "STU-104", name: "ទិត្យ វីរៈ", gender: "ប្រុស", phone: "017 666 444" },
    { id: "std_205", classId: "cls_11b", code: "STU-105", name: "អ៊ុង ស្រីពេជ្រ", gender: "ស្រី", phone: "086 555 555" },

    // ថ្នាក់ភាសាអង់គ្លេស Level 3
    { id: "std_301", classId: "cls_eng_l3", code: "ENG-001", name: "សម កល្យាណ", gender: "ស្រី", phone: "012 444 111" },
    { id: "std_302", classId: "cls_eng_l3", code: "ENG-002", name: "រ៉ាត់ ពិសិដ្ឋ", gender: "ប្រុស", phone: "097 333 222" },
    { id: "std_303", classId: "cls_eng_l3", code: "ENG-003", name: "ញ៉ែម ចាន់ដារ៉ា", gender: "ប្រុស", phone: "088 222 333" }
  ],
  // Attendance Structure: { "classId_year_month_shift": { "studentId_day": "P" | "A" | "L" | "T" } }
  attendance: generateSampleAttendance()
};

function generateSampleAttendance() {
  return {};
}
