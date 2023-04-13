const { SlashCommandBuilder } = require("discord.js");
const { models } = require("../../database");
const { COMMANDS, SUBCOMMANDS, CLUE } = require("../../Constants");

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
    ),
/*---------------------------------------------------------------------------------
 *  RESPONSES
 *--------------------------------------------------------------------------------*/
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    /*-----------------------------------------------------
     *  RESPONSE: create
     *-----------------------------------------------------*/
    if (subcommand === SUBCOMMANDS.CLUE.CREATE) {
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

      // Set up clue blocking
      if (unlockedBy) {
        const blockingClue = unlockedBy
          ? await models.Clue.findByPk(unlockedBy)
          : undefined;
        blockingClue.addUnlocks(clue);
        console.log(`${clue.title} is be blocked by ${blockingClue.title}`);
      }

      await clue.save();
      await interaction.reply(
        `Created new clue with name ${clue.title} in hunt ${hunt.title}.`
      );
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
      await documentGuess(clue, password, interaction);

      if (clue.status === CLUE.STATUS.LOCKED) {
        await interaction.reply(`You need to unlock that clue first!`);
      } else if (isCorrectGuess(clue, password)) {
        await interaction.reply(
          `${interaction.user.toString()} solved ${
            clue.title
          } with the password!`
        );
        await solveClue(clue, interaction);
      } else {
        await interaction.reply(
          `${interaction.user.toString()} failed to guess the password. Too bad!`
        );
      }
    }
  },
};

/*---------------------------------------------------------------------------------
 *  HELPER FUNCTIONS
 *--------------------------------------------------------------------------------*/
async function solveClue(clue, interaction) {
  clue.status = CLUE.STATUS.SOLVED;
  clue.save();
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
  if (cluesToUnlock.length > 0) {
    await interaction.followUp(`${cluesToUnlock.length} new clues unlocked.`);
  }
}

async function documentGuess(clue, password, interaction) {
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