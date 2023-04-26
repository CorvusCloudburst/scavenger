const { CLUE, DISCORD } = require("../../Constants");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "Clue",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: CLUE.COLUMNS.ID,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
        field: CLUE.COLUMNS.TITLE,
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM(
          CLUE.STATUS.LOCKED,
          CLUE.STATUS.UNLOCKED,
          CLUE.STATUS.SOLVED
        ),
        field: CLUE.COLUMNS.STATUS,
      },
      text: {
        allowNull: true,
        type: DataTypes.TEXT,
        field: CLUE.COLUMNS.TEXT,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
        field: CLUE.COLUMNS.PASSWORD,
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
        field: DISCORD.EMBED.THUMBNAIL,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
        field: DISCORD.EMBED.IMAGE,
      },
      guild: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
        field: DISCORD.GUILD,
      },
      solved_by: {
        type: DataTypes.STRING,
        allowNull: true,
        field: CLUE.COLUMNS.SOLVED_BY,
      },
      chosen_one: {
        type: DataTypes.STRING,
        allowNull: true,
        field: CLUE.COLUMNS.CHOSEN_ONE,
      },
    },
    {
      timestamps: false,
    }
  );
};
