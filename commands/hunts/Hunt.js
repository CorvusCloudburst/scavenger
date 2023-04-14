const { SlashCommandBuilder } = require("discord.js");
const { models } = require("../../database");
const { COMMANDS, SUBCOMMANDS, HUNT, CLUE, DISCORD, COLORS, ICONS} = require("../../Constants");
const {HuntEmbed} = require("../../components/HuntEmbed");
const {NotificationEmbed} = require("../../components/NotificationEmbed");

module.exports = {
  data: new SlashCommandBuilder()
/*---------------------------------------------------------------------------------
 *  COMMANDS
 *--------------------------------------------------------------------------------*/
    .setName(COMMANDS.HUNT)
    .setDescription("Manage your server's hunts.")
    /*-----------------------------------------------------
     *  COMMAND: create
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.CREATE)
        .setDescription("Create a new hunt.")
        .addStringOption((option) =>
          option
            .setName(HUNT.COLUMNS.TITLE)
            .setDescription("Name your hunt.")
            .setRequired(false)
        )
          .addStringOption((option) =>
              option
                  .setName(HUNT.COLUMNS.DESCRIPTION)
                  .setDescription("A brief description of your hunt.")
                  .setRequired(false)
          )
          .addStringOption((option) =>
              option
                  .setName(DISCORD.EMBED.THUMBNAIL)
                  .setDescription("A thumbnail image url to display when the hunt details are viewed.")
                  .setRequired(false)
          )
          .addStringOption((option) =>
              option
                  .setName(DISCORD.EMBED.IMAGE)
                  .setDescription("A featured image url to display when the hunt details are viewed.")
                  .setRequired(false)
          )
    )
    /*-----------------------------------------------------
     *  COMMAND: begin
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.BEGIN)
        .setDescription("Begin a hunt.")
        .addStringOption((option) =>
          option
            .setName(HUNT.COLUMNS.ID)
            .setDescription("The ID of the hunt to begin.")
            .setRequired(true)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: end
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.END)
        .setDescription("End a hunt.")
        .addStringOption((option) =>
          option
            .setName(HUNT.COLUMNS.ID)
            .setDescription("The ID of the hunt to end.")
            .setRequired(true)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: delete
     *-----------------------------------------------------*/
      .addSubcommand((subcommand) =>
          subcommand
              .setName(SUBCOMMANDS.HUNT.DELETE)
              .setDescription("Delete a hunt.")
              .addBooleanOption((option) =>
              option
                  .setName('all')
                  .setDescription('Delete all hunts on this server. (DESTRUCTIVE!)')
                  .setRequired(false)
              )
              .addIntegerOption((option) =>
                  option
                      .setName(HUNT.COLUMNS.ID)
                      .setDescription("The ID of the hunt to delete.")
                      .setRequired(false)
              )
      )
    /*-----------------------------------------------------
     *  COMMAND: list
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.HUNT.LIST)
        .setDescription("List all hunts.")
    ),
/*---------------------------------------------------------------------------------
 *  RESPONSES
 *--------------------------------------------------------------------------------*/
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    /*-----------------------------------------------------
     *  RESPONSE: create
     *-----------------------------------------------------*/
    if (subcommand === SUBCOMMANDS.HUNT.CREATE) {
      const title = interaction.options.getString(HUNT.COLUMNS.TITLE);
      const hunt = await models.Hunt.create({
        title: title,
        description: interaction.options.getString(HUNT.COLUMNS.DESCRIPTION),
        status: HUNT.STATUS.INACTIVE,
        guild: interaction.guild.id,
        thumbnail: interaction.options.getString(DISCORD.EMBED.THUMBNAIL),
        image: interaction.options.getString(DISCORD.EMBED.IMAGE),
      });
      if (!hunt.title) {
        hunt.title = `Hunt ${hunt.id}`;
      }
      await hunt.save();
      const announcementEmbed = NotificationEmbed({
        message: `Created new hunt: ${hunt.title}!`,
      });
      const responseEmbed = await HuntEmbed(hunt);
      await interaction.reply({embeds: [announcementEmbed, responseEmbed]});
      /*-----------------------------------------------------
       *  RESPONSE: begin
       *-----------------------------------------------------*/
    } else if (subcommand === SUBCOMMANDS.HUNT.BEGIN) {
      const id = interaction.options.getString(HUNT.COLUMNS.ID);
      const hunt = await models.Hunt.findByPk(id);
      await beginHunt(hunt, interaction);
      /*-----------------------------------------------------
       *  RESPONSE: end
       *-----------------------------------------------------*/
    } else if (subcommand === SUBCOMMANDS.HUNT.END) {
      const id = interaction.options.getString(HUNT.COLUMNS.ID);
      const hunt = await models.Hunt.findByPk(id);
      hunt.set({ status: HUNT.STATUS.INACTIVE });
      await hunt.save();
      const responseEmbed = await HuntEmbed(hunt);
      await interaction.reply({embeds:[responseEmbed]});
      /*-----------------------------------------------------
       *  COMMAND: delete
       *-----------------------------------------------------*/
    } else if (subcommand === SUBCOMMANDS.HUNT.DELETE) {
      // TODO: delete hunts
      /*-----------------------------------------------------
       *  RESPONSE: list
       *-----------------------------------------------------*/
    } else if (subcommand === SUBCOMMANDS.HUNT.LIST) {
      const hunts = await models.Hunt.findAll({ include: models.Clue });
      const embeds = [];
      for (const hunt of hunts) {
        const view = await HuntEmbed(hunt);
        embeds.push(view);
      }
      await interaction.reply({embeds:embeds});
    }
  },
};

/*---------------------------------------------------------------------------------
 *  HELPER FUNCTIONS
 *--------------------------------------------------------------------------------*/

async function createHunt() {

}

async function beginHunt(hunt, interaction) {
  hunt.status = HUNT.STATUS.ACTIVE;
  hunt.save();
  const cluesToUnlock = await models.Clue.findAll({
    where: { unlocked_by: null, status: CLUE.STATUS.LOCKED, hunt_id: hunt.id },
  });
  cluesToUnlock.forEach((unlockedClue) => {
    unlockedClue.status = CLUE.STATUS.UNLOCKED;
    unlockedClue.save();
  });
  const announcementEmbed = NotificationEmbed({
    message: `${hunt.title} has commenced!`,
  });
  const responseEmbed = await HuntEmbed(hunt);
  const clueUnlockEmbed = NotificationEmbed({
    message: `${cluesToUnlock.length} new clue${cluesToUnlock.length > 1 ? 's' : ''} unlocked.`,
  });
  const embeds = [announcementEmbed, responseEmbed];
  if (cluesToUnlock.length > 0) {
    embeds.push(clueUnlockEmbed);
  }
  await interaction.reply({embeds: embeds});
}