const COMMANDS = {
  HUNT: "hunt",
  CLUE: "clue",
  STATS: "stats",
};

const SUBCOMMANDS = {
  HUNT: {
    CREATE: "create",
    BEGIN: "begin",
    END: "end",
    LIST: "list",
    DELETE: "delete",
  },
  CLUE: {
    CREATE: "create",
    GUESS: "guess",
    LIST: "list",
    DELETE: "delete",
  },
  STATS: {
    SERVER: "server",
  },
};

const HUNT = {
  COLUMNS: {
    ID: "id",
    TITLE: "title",
    DESCRIPTION: "description",
    STATUS: "status",
  },
  STATUS: {
    INACTIVE: "INACTIVE",
    ACTIVE: "ACTIVE",
  },
};

const CLUE = {
  COLUMNS: {
    ID: "id",
    TITLE: "title",
    STATUS: "status",
    TEXT: "text",
    PASSWORD: "password",
    HUNT: "hunt_id",
    UNLOCKED_BY: "unlocked_by",
  },
  STATUS: {
    LOCKED: "LOCKED",
    UNLOCKED: "UNLOCKED",
    SOLVED: "SOLVED",
  },
};

const GUESS = {
  COLUMNS: {
    ID: "id",
    PASSWORD: "password",
    SUCCESS: "success",
    CLUE: "clue_id",
  },
};

const DISCORD = {
  USER: "user",
  GUILD: "guild",
  EMBED: {
    THUMBNAIL: "thumbnail",
    IMAGE: "image",
  },
};

const COLORS = {
  HUNT_STATUS: {
    ACTIVE: 0x318f4a,
    INACTIVE: 0x8f313c,
  },
  CLUE_STATUS: {
    LOCKED: 0x8f313c,
    UNLOCKED: 0x8f7131,
    SOLVED: 0x318f4a,
  },
  NOTIFICATION: 0x313e8f,
  WHISPER: 0x50318f,
};

const ICONS = {
  // TODO: Replace everything but skeleton with images i can create the source to
  CORVID_SKELETON: "https://cdn.discordapp.com/emojis/975911441846657124.png",
  HUNT: "",
  CLUE: "",
  NOTIFICATION: "",
  ANNOUNCEMENT: "",
  SOLVE: "",
};

const MESSAGING = {
  UNKNOWN_ERROR: "I'm a little birdbrained right now, sorry! Try back later.",
};

module.exports = {
  COMMANDS,
  SUBCOMMANDS,
  HUNT,
  CLUE,
  GUESS,
  DISCORD,
  COLORS,
  ICONS,
  MESSAGING,
};
