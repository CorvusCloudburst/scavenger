# scavenger

Scavenger is a bot that helps you host scavenger hunts on your Discord server.

To fork and modify this repo, it will helpful for you to have a passing familiarity with the [Discord Developer Documentation](https://discord.com/developers/docs/intro).

## Setup

Clone this project. In your project root folder, run:

```shell
npm install
```

If you already have an application and bot user set up on Discord, you can skip past the next section and pick up with [Running scavenger](#running-scavenger).

### Creating a Discord application and bot user

[This tutorial](https://discordpy.readthedocs.io/en/stable/discord.html) will walk you through the process of creating a Discord application and an associated bot account.

Once your bot user is created, you will be provided with a token for it. You will only be shown this token once, so save it somewhere safe. Do not share it or merge it into a code repo.

### Running scavenger

In the root of this project, create a `.env` file. This file is already ignored using `.gitignore`, but just in case it needs to be said, *do not merge this file into a cloud-hosted repository*.

Add the following line to your `.env`:
 ```shell
  DISCORD_TOKEN={token}
 ```
 
Where the `{token}` value is your bot user's token.

Then, still in your root directory, run the command:
```shell
npm run start
```

The application will start. You should now see the bot as logged in on your server.

## Usage

### Hunts

A **Hunt** is the central event this bot is built to run. It will contain one or more [**Clues**](#clues).
The following commands allow you to set up and interact with a Hunt:

- `hunt create` : This command creates a Hunt. The Hunt will start off in the **INACTIVE** state so you can modify it as needed before your server members are able to interact with it.

  - `title` *(optional)*: Name your Hunt. This name will appear at the top of the Hunt embed. If you do not provide a name, a numbered name will be automatically generated, such as *Hunt 42*.
  - `description` *(optional)*: Provide a description for your Hunt for extra flavor and fun. This text will appear below the title on the Hunt embed.
  - `thumbnail` *(optional)*: This option allows you to provide a custom thumbnail url for your Hunt. This thumbnail will appear in the top right of the embed.
  - `image` *(optional)*: This option allows you to provide a custom featured image url for your Hunt. This featured image will occupy the the full width of the embed, below the Hunt details.

- `hunt list` : Lists all the hunts on the server.
  - `id` *(optional)*: If you include a specific Hunt ID, this command will instead list that Hunt's details followed by all of the Clues in that Hunt.

- `hunt begin` : Once you are done creating and modifying your Hunt, you can use this command to commence the adventure! Your server members will now be able to participate in the Hunt.
  - `id` **(required)**: You must include the ID of the Hunt you wish to commence.

- `hunt end` : This command declares a Hunt officially over! Players will no longer be able to solve Clues.
  - `id` **(required)**: You must include the ID of the Hunt you wish to conclude.

- `hunt delete` : This command will completely delete a specific Hunt and remove it from the list of Hunts associated with your server.
  - `purge` *(optional)*: If you use this flag, ALL Hunts on the server will be deleted. This command is primarily intended for debugging purposes and is not recommended for use unless you're very sure you're ready to lose ALL of your Hunts FOREVER.
  - `id` *(optional)*: The Hunt to be deleted. If used alongside the `purge` flag, then this Hunt will instead be the only one spared.

### Clues

A **Clue** is a challenge that your players must overcome to advance in a [**Hunt**](#hunts).

The following commands allow you to set up and interact with a Clue:

- `clue create` : This command creates a Clue. Clues begin in the **LOCKED** state by default.

  - `hunt_id` **(required)**: The ID of the Hunt this Clue should belong to.
  - `password` **(required)**: The secret password to solve the Clue.
  - `title` *(optional)*: A title for your clue. If you do not provide a name, a numbered name will be automatically generated, such as *Clue 42*.
  - `text` *(optional)*: A description or text body for your Clue. This could be used to provide upfront hints, or might just be for some vibes and ambience!
  - `unlocked_by` *(optional)*: By default, all Clues are set to UNLOCKED when the Hunt begins, and are therefore immediately available to be solved. If you would like a Clue to instead only be unlocked once a prerequisite Clue is solved, you may provide the ID of the prerequisite Clue here. When the prerequisite Clue is solved, this Clue will automatically be unlocked.
  - `chosen_one` *(optional)*: By providing a Discord user's unique username in this field, only that specific user will be able to unlock this Clue. (TODO: Update with example)

- `clue delete` : This command is used to delete Clues.
  - `id` *(optional)*: The ID of a specific Clue to delete.
  - `hunt_id` *(optional)*: All Clues in the specified Hunt will be deleted.
  - `purge` *(optional)*: If you use this flag, all Clues across the whole server will be deleted, and the Hunts left empty. This command is primarily used for debugging purposes and is not recommended unless you're very sure you're ready to lose ALL of your Clues FOREVER.

- `clue list` : This command lets you view the details of a specific Clue, or list out many Clues. If no options are provided, it will list out every Clue on the server.
  - `id` *(optional)*: Providing the ID of a specific Clue will show you details and statistics about that Clue.
  - `hunt_id` *(optional)*: Providing a Hunt ID will let view all Clues in a Hunt.
  - `status` *(optional)*: Using this option will limit your results to only Clues of a specific status. For example, **UNLOCKED**. (WIP: This option seems to currently do nothing. Debugging in progress.)

- `clue solve` : Attempt to solve a Clue.
  - `id` **(required)**: The ID of the Clue you are attempting to solve.
  - `password` **(required)**: The secret password.

### Statistics

- `stats server` : Displays some statistics for the server as a whole. **(This command is a work-in-progress, so it's still a bit basic.)**

- `stats user` : Displays statistics for a specific user. If no user is provided, the current user will be used. **(WIP: This command is not yet implemented!)**
  - `user` *(optional)*: The unique username of the Discord user to display stats for.

## Code Changes

Feel free to fork this repo and modify it for your own use case!

If you add, remove, or modify a command, you will need to deploy your new commands so that the Discord API knows how to handle them.

To deploy your commands for use on your personal server, use:
```shell
npm run deploy:test
```

Once you have thoroughly tested out your commands and are confident they are ready for usage, you can deploy them globally by running:
```shell
npm run deploy:global
```
