const {ICONS} = require("../Constants");
const NotificationEmbed = function ({color, message, icon}) {
    return {
        author: {
            name: message,
            icon_url: icon ?? ICONS.CORVID_SKELETON,
        },
        color: color,
    };
}

module.exports = { NotificationEmbed };