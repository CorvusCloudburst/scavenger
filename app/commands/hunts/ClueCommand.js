const { SlashCommandBuilder } = require("discord.js");
const { models } = require("../../database");
const {
  COMMANDS,
  SUBCOMMANDS,
  CLUE,
  MESSAGING,
  ICONS,
  HUNT,
} = require("../../Constants");
const { ClueEmbed } = require("../../components/ClueEmbed");
const { NotificationEmbed } = require("../../components/NotificationEmbed");
const { getUserHandle, getAvatarImageUrl } = require("../../DiscordTools");
const { getMatchingClueStatus } = require("../../Utility");
const { HuntEmbed } = require("../../components/HuntEmbed");

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
              "The ID of the hunt this clue should be added to. (required)"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.PASSWORD)
            .setDescription("A magic word that solves the clue. (optional)")
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
    )
    /*-----------------------------------------------------
     *  COMMAND: guess
     *-----------------------------------------------------*/
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMANDS.CLUE.SOLVE)
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
        .addStringOption((option) =>
          option
            .setName(CLUE.COLUMNS.STATUS)
            .setDescription("Only show clues of a specific status. (optional)")
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
          true
        );

        const hunt = huntId ? await models.Hunt.findByPk(huntId) : undefined;
        const blockingClue = unlockedBy
          ? await models.Clue.findByPk(unlockedBy)
          : undefined;

        // Argument checks
        if (huntId && !hunt) {
          await interaction.reply(
            `Sorry, I couldn't find a hunt with ID ${huntId}. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else if (unlockedBy && !blockingClue) {
          await interaction.reply(
            `Sorry, I couldn't find a clue with ID ${unlockedBy}. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else {
          // Create clue
          const clue = await hunt.createClue({
            title: title,
            text: text,
            status: CLUE.STATUS.LOCKED,
            password: password,
            guild: interaction.guild.id,
          });
          if (!clue.title) {
            clue.title = `Clue ${clue.id}`;
          }

          await clue.save();

          // Respond
          const announcementEmbed = NotificationEmbed({
            message: `Created new clue: ${clue.title}!`,
            icon: ICONS.SPARKLES.GREEN,
          });
          const responseEmbed = await ClueEmbed(clue);
          await interaction.reply({
            embeds: [announcementEmbed, responseEmbed],
          });
        }
        /*-----------------------------------------------------
         *  RESPONSE: guess
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.CLUE.SOLVE) {
        const clueId = interaction.options.getInteger(CLUE.COLUMNS.ID, true);
        const password = interaction.options.getString(
          CLUE.COLUMNS.PASSWORD,
          true
        );

        const clue = await models.Clue.findByPk(clueId);
        const hunt = await clue.getHunt();

        await documentGuess(clue, password, interaction); // TODO: Consider making public shaming (aka guess tracking) optional

        // Argument checks
        if (!clue) {
          await interaction.reply(
            `Sorry, I couldn't find a clue with ID ${clueId}. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else if (hunt.status !== HUNT.STATUS.ACTIVE) {
          await interaction.reply(
            "That clue belongs to an inactive hunt. Either it hasn't begun yet, or it has already ended! To begin a hunt, use `/hunt begin {id}` ."
          );
        } else if (clue.status === CLUE.STATUS.LOCKED) {
          await interaction.reply(`You need to unlock that clue first!`);
          // Attempt to solve
        } else if (isCorrectGuess(clue, password)) {
          await solveClue(clue, interaction);
        } else {
          const notificationEmbed = NotificationEmbed({
            message: `${getUserHandle(
              interaction
            )} failed to solve clue. Too bad!`,
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
        const statusArg = interaction.options.getString(
          CLUE.COLUMNS.STATUS,
          false
        );

        const clue = clueId ? await models.Clue.findByPk(clueId) : undefined;
        const hunt = huntId ? await models.Hunt.findByPk(huntId) : undefined;
        const status = getMatchingClueStatus(statusArg);

        // Argument checks
        if (clueId && !clue) {
          await interaction.reply(
            `Sorry, I couldn't find a clue with ID ${clueId}. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else if (huntId && !hunt) {
          await interaction.reply(
            `Sorry, I couldn't find a hunt with ID ${huntId}. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else if (statusArg && !status) {
          await interaction.reply(
            `Sorry, I couldn't find a matching clue status for '${statusArg}'. Did you type that correctly?`
          );
        } else {
          await listClues({ interaction, clueId, huntId, status });
        }
        /*-----------------------------------------------------
         *  RESPONSE: delete
         *-----------------------------------------------------*/
      } else if (subcommand === SUBCOMMANDS.CLUE.DELETE) {
        const clueId = interaction.options.getInteger(CLUE.COLUMNS.ID, false);
        const huntId = interaction.options.getInteger(CLUE.COLUMNS.HUNT, false);
        const purge = interaction.options.getBoolean("purge");

        const earmarkedClue = clueId
          ? await models.Clue.findByPk(clueId)
          : null;
        const hunt = huntId ? await models.Hunt.findByPk(huntId) : null;

        // Argument checks
        if (clueId && !earmarkedClue) {
          await interaction.reply(
            `Sorry, I couldn't find a clue with ID ${clueId}. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else if (huntId && !hunt) {
          await interaction.reply(
            `Sorry, I couldn't find a hunt with ID ${huntId}. Are you sure it was created in ${interaction.member.guild.name}?`
          );
        } else if (hunt && hunt?.guild !== interaction.member.guild.id) {
          // Ensure we're only modifying hunts from this server
          await interaction.reply(
            `${hunt.title} is managed by another server.`
          );
        } else {
          // Deletes
          await deleteClues({ interaction, earmarkedClue, hunt, purge });
        }
      }
    } catch (error) {
      console.error(error);
      interaction.reply(MESSAGING.UNKNOWN_ERROR);
    }
  },
};

/*---------------------------------------------------------------------------------
 *  HELPER FUNCTIONS
 *--------------------------------------------------------------------------------*/

/*
 *  Sets the clue to SOLVED, and updates all unblocked clues to UNLOCKED status.
 */
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

/*
 *  Lists clues
 */
async function listClues({ interaction, clueId, huntId, status }) {
  // List of clues to return
  const clues = [];

  // Get the clues
  if (clueId) {
    // Fetch one specific clue
    const clue = await models.Clue.findByPk(clueId);
    clues.push(clue);
  } else {
    // All possible clues on server.
    const serverClues = await models.Clue.findAll({
      include: { model: models.Hunt, required: true },
      where: { guild: interaction.guild.id },
    });

    if (huntId) {
      // Scope by hunt
      serverClues.forEach((clue) => {
        if (clue.hunt_id === huntId) {
          clues.push(clue);
        }
      });
    } else {
      // Check all possible clues
      clues.push(...serverClues);
    }
  }

  // Filter the results if indicated
  const filteredClues = [];
  if (status) {
    filteredClues.push(...clues.filter((clue) => clue.status === status));
  } else {
    filteredClues.push(...clues);
  }

  // Check clues were found
  if (!filteredClues.length) {
    await interaction.reply(
      "Could not find any matching clues on this server. Try widening your search!"
    );
  } else {
    // Generate embeds
    const clueEmbeds = [];
    for (const clue of filteredClues) {
      const embed = await ClueEmbed(clue);
      clueEmbeds.push(embed);
    }
    // Reply
    await interaction.reply({ embeds: clueEmbeds });
  }
}

/*
 *  Deletes clues
 */
async function deleteClues({ interaction, earmarkedClue, hunt, purge }) {
  const totalHuntClues = (await hunt?.getClues())?.length;
  const pluralizeTotalHuntClues = totalHuntClues > 1 ? "s" : "";
  if (purge) {
    // Delete all clues on server
    const serverClues = await models.Clue.findAll({
      include: { model: models.Hunt, required: true },
      where: { guild: interaction.guild.id },
    });
    const totalClues = serverClues.length;
    for (const clue of serverClues) {
      if (clue.id !== earmarkedClue?.id && clue.hunt_id !== hunt?.id) {
        await clue.destroy();
      }
    }

    // Reply
    const totalDeletedClues = earmarkedClue ? totalClues - 1 : totalClues;
    const and = earmarkedClue && hunt ? "and " : "";
    const sparedClue = earmarkedClue ? `, sparing ${earmarkedClue.title}` : "";
    const sparedHunt = hunt
      ? `, ${and}sparing ${totalHuntClues} clue${pluralizeTotalHuntClues} from ${hunt.title}`
      : "";
    const pluralize = totalDeletedClues > 1 ? "s" : "";
    const deleteText = `Deleted ${totalDeletedClues} clue${pluralize} from ${interaction.member.guild.name}${sparedClue}${sparedHunt}.`;

    const notificationEmbed = NotificationEmbed({
      message: deleteText,
      icon: ICONS.SPARKLES.RED,
    });
    const embeds = [notificationEmbed];
    if (hunt) {
      const huntEmbed = await HuntEmbed(hunt);
      embeds.push(huntEmbed);
    }
    if (earmarkedClue) {
      const clueEmbed = await ClueEmbed(earmarkedClue);
      embeds.push(clueEmbed);
    }
    interaction.reply({ embeds: embeds });
  } else if (hunt) {
    // Delete all clues in hunt
    const cluesByHunt = await hunt.getClues();
    for (const deletedClue of cluesByHunt) {
      if (deletedClue.id !== earmarkedClue?.id) {
        await deletedClue.destroy();
      }
    }
    const sparedClue = earmarkedClue ? `, sparing ${earmarkedClue.title}` : "";
    const notificationEmbed = NotificationEmbed({
      message: `Deleted ${totalHuntClues} clue${pluralizeTotalHuntClues} from ${hunt.title}${sparedClue}.`,
      icon: ICONS.SPARKLES.RED,
    });
    const embeds = [notificationEmbed];
    const huntEmbed = await HuntEmbed(hunt);
    embeds.push(huntEmbed);
    if (earmarkedClue) {
      const clueEmbed = await ClueEmbed(earmarkedClue);
      embeds.push(clueEmbed);
    }
    await interaction.reply({ embeds: [embeds] });
  } else if (earmarkedClue) {
    // Delete individual clue
    await earmarkedClue.destroy();
    const notificationEmbed = NotificationEmbed({
      message: `Deleted ${earmarkedClue.title}.`,
      icon: ICONS.SPARKLES.RED,
    });
    await interaction.reply({ embeds: [notificationEmbed] });
  }
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
