export function validateSpanishDni(dni) {
  if (!dni) return false;
  const regex = /^([0-9]{8})([A-Z])$/;
  const match = dni.toUpperCase().match(regex);
  if (!match) return false;
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const number = parseInt(match[1], 10);
  const letter = match[2];
  return letters[number % 23] === letter;
}
