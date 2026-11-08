// soma flow club: the sessions and the whatsapp group. Paul fills these in; the page reads them from /api/soma.
// when is the local time at the place, written as YYYY-MM-DDTHH:MM. A session that has begun is closed.
// test sessions are only shown with ?test=1, so the page can be tried before the first real date.
const SESSIONS = [
  { id: "test", when: "2030-01-01T10:00", place: "test", test: true },
];
const PLACES = 15;
const GROUP = ""; // the whatsapp group invite link, https://chat.whatsapp.com/…

module.exports = { SESSIONS, PLACES, GROUP };
