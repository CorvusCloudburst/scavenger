const { SlashCommandBuilder } = require("discord.js");
const { models } = require("../../database");
const { COMMANDS, SUBCOMMANDS, CLUE } = require("../../Constants");
const { ClueEmbed } = require("../../components/ClueEmbed");
const { NotificationEmbed } = require("../../components/NotificationEmbed");
const { getUserHandle, getAvatarImageUrl } = require("../../DiscordTools");

module.exports = {
  data: new SlashCommandBuilder()
    /*---------------------------------------------------------------------------------
     *  COMMANDS
     *--------------------------------------------------------------------------------*/
    .setName(COMMANDS.CLUE)
    .setDescription("Manage your hunt's clues.")
    /*-----------------------------------------------------
     *  COMMAND: create
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.CREATE)
        .setDescription("Create a new clue.")
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.HUNT)
            .setDescription(
              "The id of the hunt this clue should be added to. (required)"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.TITLE)
            .setDescription("A title for your clue. (optional)")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.TEXT)
            .setDescription(
              "Any text you would like your clue to display. (optional)"
            )
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.UNLOCKED_BY)
            .setDescription(
              "The id of a clue that must be solved before this one is visible. (optional)"
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.PASSWORD)
            .setDescription("A magic word that solves the clue. (optional)")
            .setRequired(false)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: guess
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.GUESS)
        .setDescription("Guess the magic word.")
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.ID)
            .setDescription("The id of the clue you are guessing. (required)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.PASSWORD)
            .setDescription("Your guess. (required)")
            .setRequired(true)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: list
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.LIST)
        .setDescription("Display all available clues on this server.")
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.ID)
            .setDescription("Display a clue. (optional)")
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.HUNT)
            .setDescription("View all clues in a hunt. (optional)")
            .setRequired(false)
        )
    )
    /*-----------------------------------------------------
     *  COMMAND: delete
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.DELETE)
        .setDescription("Delete clues.")
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.ID)
            .setDescription("Delete a clue. (optional)")
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName(CLUE.COLUMNS.HUNT)
            .setDescription("Delete all clues in a hunt. (optional)")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("purge")
            .setDescription("Delete all clues across all hunts on this server.")
            .setRequired(false)
        )
    ),
  /*---------------------------------------------------------------------------------
   *  RESPONSES
   *--------------------------------------------------------------------------------*/
  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      /*-----------------------------------------------------
       *  RESPONSE: create
       *-----------------------------------------------------*/
      if (subcommand === SUBCOMMANDS.CLUE.CREATE) {
        // Fetch options
        const huntId = interaction.options.getInteger(CLUE.COLUMNS.HUNT, true);
        const title = interaction.options.getString(CLUE.COLUMNS.TITLE, false);
        const text = interaction.options.getString(CLUE.COLUMNS.TEXT, false);
        const unlockedBy = interaction.options.getInteger(
          CLUE.COLUMNS.UNLOCKED_BY,
          false
        );
        const password = interaction.options.getString(
          CLUE.COLUMNS.PASSWORD,
          false
        );

        // Create clue
        const hunt = await models.Hunt.findByPk(huntId);
        const clue = await hunt.createClue({
          title: title,
          text: text,
          status: CLUE.STATUS.LOCKED,
          password: password,
        });
        if (!clue.title) {
          clue.title = `Clue ${clue.id}`;
        }

        // Lock this clue behind another clue, if specified
        if (unlockedBy) {
          const blockingClue = unlockedBy
            ? await models.Clue.findByPk(unlockedBy)
            : undefined;
          blockingClue.addUnlocks(clue);
        }

        await clue.save();

        // Respond
        const announcementEmbed = NotificationEmbed({
          message: `Created new clue: ${clue.title}!`,
        });
        const responseEmbed = await ClueEmbed(clue);
        await interaction.reply({ embeds: [announcementEmbed, responseEmbed] });
        /*-----------------------------------------------------
         *  RESPONSE: guess
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.CLUE.GUESS) {
        const clueId = interaction.options.getInteger(CLUE.COLUMNS.ID, true);
        const password = interaction.options.getString(
          CLUE.COLUMNS.PASSWORD,
          true
        );

        const clue = await models.Clue.findByPk(clueId);
        await documentGuess(clue, password, interaction); // TODO: Consider making public shaming (aka guess tracking) optional

        if (clue.status === CLUE.STATUS.LOCKED) {
          await interaction.reply(`You need to unlock that clue first!`);
        } else if (isCorrectGuess(clue, password)) {
          await solveClue(clue, interaction);
        } else {
          const notificationEmbed = NotificationEmbed({
            message: `${getUserHandle(
              interaction
            )} failed to guess the password. Too bad!`,
            icon: getAvatarImageUrl(interaction.member),
          });
          await interaction.reply({ embeds: [notificationEmbed] });
        }
        /*-----------------------------------------------------
         *  RESPONSE: list
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.CLUE.LIST) {
        const clueId = interaction.options.getInteger(CLUE.COLUMNS.ID, false);
        const huntId = interaction.options.getInteger(CLUE.COLUMNS.HUNT, false);
        const clues = [];

        if (clueId) {
          // Fetch one clue
          const clue = await models.Clue.findByPk(clueId);
          clues.push(clue);
        } else if (huntId) {
          // Scope by hunt
          const huntClues = await models.Clue.findAll({
            where: { hunt_id: huntId },
          });
          huntClues.forEach((clue) => clues.push(clue));
        } else {
          // All clues on server.
          const serverClues = await models.Clue.findAll({
            include: { model: models.Hunt, required: true },
          });
          for (const clue of serverClues) {
            const hunt = await clue.getHunt();
            if (hunt.guild === interaction.member.guild.id) {
              clues.push(clue);
            }
          }
        }

        // Check clues were found
        if (!clues.length) {
          await interaction.reply(
            "Could not find any matching clues on this server. Try widening your search!"
          );
        } else {
          // Generate embeds
          const clueEmbeds = [];
          for (const clue of clues) {
            const embed = await ClueEmbed(clue);
            clueEmbeds.push(embed);
          }
          // Reply
          await interaction.reply({ embeds: clueEmbeds });
        }
        /*-----------------------------------------------------
         *  RESPONSE: delete
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.CLUE.DELETE) {
        const clueId = interaction.options.getInteger(CLUE.COLUMNS.ID, false);
        const huntId = interaction.options.getInteger(CLUE.COLUMNS.HUNT, false);
        const purge = interaction.options.getBoolean("purge");

        console.log(clueId);

        const earmarkedClue = clueId
          ? await models.Clue.findByPk(clueId)
          : null;
        const clueTitle = earmarkedClue?.title;

        // Ensure we're only modifying hunts from this server
        const hunt = huntId ? await models.Hunt.findByPk(huntId) : null;
        if (hunt && hunt?.guild !== interaction.member.guild.id) {
          await interaction.reply(
            `${hunt.title} is managed by another server.`
          );
        } else {
          if (purge) {
            // Delete all clues on server
            const serverClues = await models.Clue.findAll({
              include: { model: models.Hunt, required: true },
            });
            for (const clue of serverClues) {
              const clueHunt = await clue.getHunt();
              if (
                clueHunt.guild === interaction.member.guild.id &&
                clue.id !== clueId &&
                clue.hunt_id !== huntId
              ) {
                await clue.destroy();
              }
            }
            await interaction.reply(`Deleted all clues.`);
          } else if (huntId) {
            // Delete all clues in hunt
            const cluesByHunt = await hunt.getClues();
            cluesByHunt.forEach((clue) => {
              if (clue.id !== clueId) {
                clue.destroy();
              }
            });
            await interaction.reply(`Deleted all clues in ${hunt.title}.`);
          } else if (clueId) {
            // Delete individual clue
            await earmarkedClue.destroy();
            await interaction.reply(`${clueTitle} has been deleted.`);
          }
        }
      }
    } catch (error) {
      console.error(error);
      interaction.reply(
        "I'm a little birdbrained right now, sorry! Try back later."
      );
    }
  },
};

/*---------------------------------------------------------------------------------
 *  HELPER FUNCTIONS
 *--------------------------------------------------------------------------------*/
async function solveClue(clue, interaction) {
  // Update status
  clue.status = CLUE.STATUS.SOLVED;
  clue.save();

  // Unlock clues that were waiting on this one.
  const cluesToUnlock = await models.Clue.findAll({
    where: {
      unlocked_by: clue.id,
      status: CLUE.STATUS.LOCKED,
    },
  });
  cluesToUnlock.forEach((unlockedClue) => {
    unlockedClue.status = CLUE.STATUS.UNLOCKED;
    unlockedClue.save();
  });

  // Generate response
  const notificationEmbed = NotificationEmbed({
    message: `${clue.title} has been solved by ${getUserHandle(interaction)}!`,
    icon: getAvatarImageUrl(interaction.member),
  });
  const clueEmbed = await ClueEmbed(clue);
  const clueUnlockEmbed = NotificationEmbed({
    message: `${cluesToUnlock.length} new clue${
      cluesToUnlock.length > 1 ? "s" : ""
    } unlocked.`,
  });
  const embeds = [notificationEmbed, clueEmbed];
  if (cluesToUnlock.length > 0) {
    embeds.push(clueUnlockEmbed);
  }

  // Respond
  await interaction.reply({ embeds: embeds });
}

async function documentGuess(clue, password, interaction) {
  // Save guesses to database for public shaming purposes
  const guess = await clue.createGuess({
    user: interaction.user.toString(),
    password: password,
    success: isCorrectGuess(clue, password),
  });
  guess.save();
}

function isCorrectGuess(clue, password) {
  return clue.password && clue.password === password;
}
