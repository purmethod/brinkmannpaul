// soma flow club: the sessions and the whatsapp group. Paul fills these in; the page reads them from /api/soma.
// when is the local time at the place, written as YYYY-MM-DDTHH:MM. A session that has begun is closed.
// test sessions are only shown with ?test=1, so the page can be tried before the first real date.
// while no real date is set, people reserve a place for the next session (id "next"); its date and place
// follow in the whatsapp group, which a person only sees after signing up.
const SESSIONS = [
  { id: "2026-11-11", when: "2026-11-11T10:00", place: "" }, // paul, 8.11.: wednesday 11.11. at 10. the place follows in the group
  { id: "test", when: "2030-01-01T10:00", place: "test", test: true },
];
const PLACES = 15;
const GROUP = "https://chat.whatsapp.com/HW6kPHQnzun92USCMKUX51"; // the whatsapp group

module.exports = { SESSIONS, PLACES, GROUP };
