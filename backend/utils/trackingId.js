const crypto = require("crypto");

// No 0/O, 1/I/L — avoids mix-ups when the ID is read aloud or copied
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Random (not sequential) so nobody can guess other people's IDs
function generateTrackingId(date = new Date()) {
  const year = date.getFullYear();
  const bytes = crypto.randomBytes(8);
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `CC-${year}-${suffix}`;
}

module.exports = { generateTrackingId, ALPHABET };