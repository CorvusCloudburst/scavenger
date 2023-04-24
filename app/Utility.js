const { CLUE } = require("./Constants");

function getMatchingClueStatus(statusArg) {
  const upperCase = statusArg?.toUpperCase();
  return Object.values(CLUE.STATUS).find(
    (clueStatus) => clueStatus === upperCase
  );
}

module.exports = { getMatchingClueStatus };
