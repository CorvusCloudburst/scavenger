const COMMANDS = {
    HUNT: 'hunt',
    CLUE: 'clue',
    STATS: 'stats',
};

const SUBCOMMANDS = {
    HUNT: {
        CREATE: 'create',
        BEGIN: 'begin',
        END: 'end',
        LIST: 'list',
        DELETE: 'delete',
    },
    CLUE: {
        CREATE: 'create',
        GUESS: 'guess',
    },
    STATS: {
        SERVER: 'server',
    },
};

const HUNT = {
    COLUMNS: {
        ID: 'id',
        TITLE: 'title',
        DESCRIPTION: 'description',
        STATUS: 'status',
    },
    STATUS: {
        INACTIVE: 'INACTIVE',
        ACTIVE: 'ACTIVE',
    },
};

const CLUE = {
    COLUMNS: {
        ID: 'id',
        TITLE: 'title',
        STATUS: 'status',
        TEXT: 'text',
        PASSWORD: 'password',
        HUNT: 'hunt_id',
        UNLOCKED_BY: 'unlocked_by',

    },
    STATUS: {
        LOCKED: 'LOCKED',
        UNLOCKED: 'UNLOCKED',
        SOLVED: 'SOLVED',
    }
};

const GUESS = {
    COLUMNS: {
        ID: 'id',
        PASSWORD: 'password',
        SUCCESS: 'success',
        CLUE: 'clue_id',
    },
};

const DISCORD = {
    USER: 'user',
    GUILD: 'guild',
    EMBED: {
        THUMBNAIL: 'thumbnail',
        IMAGE: 'image',
    }
};

const COLORS = {
    STATUS: {
        ACTIVE: 0x318f4a,
        INACTIVE: 0x8f313c,
    },
};

const ICONS = {
    // TODO: Replace everything but skeleton with images i can create the source to
    CORVID_SKELETON: 'https://cdn.discordapp.com/emojis/975911441846657124.png',
    BANGBANG: 'https://discord.com/assets/9a13b8821ec2c880981df4bf3ce07177.png',
    WARNING: 'https://discord.com/assets/289673858e06dfa2e0e3a7ee610c3a30.png',
    MAGNIFY: 'https://discord.com/assets/0477c6a43026315dd623bc6367e18acb.png',
    UNLOCK: 'https://discord.com/assets/6bf346b6ca375514599aab9fa65afb9f.png',
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
};