const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("secretping")
    .setDescription("Replies with Pong... secretly!"),
  async execute(interaction) {
    await interaction.reply({ content: "*secret pong.*", ephemeral: true });
  },
};
