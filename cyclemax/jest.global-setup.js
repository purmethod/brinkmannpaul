// Run every test in a real DST time zone so date math is proven DST-safe.
module.exports = async () => {
  process.env.TZ = 'Europe/Berlin';
};
