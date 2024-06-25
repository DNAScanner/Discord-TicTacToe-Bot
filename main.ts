import {Client, Events} from "npm:discord.js";
import {Routes} from "npm:discord-api-types/v9";
import {} from "npm:@discordjs/brokers";
import {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, AnyComponentBuilder, SlashCommandBooleanOption, EmbedBuilder} from "npm:@discordjs/builders";
import {} from "npm:@discordjs/collection";
import {} from "npm:@discordjs/core";
import {} from "npm:@discordjs/formatters";
import {} from "npm:@discordjs/proxy";
import {REST} from "npm:@discordjs/rest";
import {} from "npm:@discordjs/voice";
import {} from "npm:@discordjs/util";
import {} from "npm:@discordjs/ws";

import {load} from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import {APIMessageComponentEmoji, ButtonStyle} from "npm:discord-api-types/v10";

type AwaitMessageComponentResult = {
	readonly deferUpdate: () => Promise<void>;
	readonly customId: string;
};

const pickRandomPhrase = (type: "bot" | "user" | "draw") => {
	const phrases = {
		bot: [
			//
			"Good game! I won!",
			"Nice try! I won!",
			"Better luck next time! I won!",
			"GG! I won!",
			"Nice game! I won!",
			"Easy win! I won!",
			"Close one! I won!",
			"Nice try! I won!",
			"Better luck next time! I won!",
			"GG! I won!",
			"Nice game! I won!",
			"Easy win! I won!",
			"Close one! I won!",
		],

		user: [
			//
			"Good game! You won!",
			"Nice try! You won!",
			"Better luck next time! You won!",
			"GG! You won!",
			"Nice game! You won!",
			"Easy win! You won!",
			"Close one! You won!",
			"Nice try! You won!",
			"Better luck next time! You won!",
			"GG! You won!",
			"Nice game! You won!",
			"Easy win! You won!",
			"Close one! You won!",
		],

		draw: [
			//
			"Good game! It's a draw!",
			"Nice try! It's a draw!",
			"Better luck next time! It's a draw!",
			"GG! It's a draw!",
			"Nice game! It's a draw!",
			"Easy win! It's a draw!",
			"Close one! It's a draw!",
			"Nice try! It's a draw!",
			"Better luck next time! It's a draw!",
			"GG! It's a draw!",
			"Nice game! It's a draw!",
			"Easy win! It's a draw!",
			"Close one! It's a draw!",
		],
	};

	return phrases[type][Math.floor(Math.random() * phrases[type].length)];
};

const winningCombinations = [
	[
		//
		[0, 0],
		[0, 1],
		[0, 2],
	],
	[
		//
		[1, 0],
		[1, 1],
		[1, 2],
	],
	[
		//
		[2, 0],
		[2, 1],
		[2, 2],
	],
	[
		//
		[0, 0],
		[1, 0],
		[2, 0],
	],
	[
		//
		[0, 1],
		[1, 1],
		[2, 1],
	],
	[
		//
		[0, 2],
		[1, 2],
		[2, 2],
	],
	[
		//
		[0, 0],
		[1, 1],
		[2, 2],
	],
	[
		//
		[0, 2],
		[1, 1],
		[2, 0],
	],
];

const chooseCell = {
	win: (board: number[][]) => {
		// Win the game by returning the third (empty) cell in a row of two cells that the bot has
		// If the bot has two out of three cells in a row and the third cell is empty, return the coordinates of the third cell

		for (const combination of winningCombinations) {
			const [a, b, c] = combination.map(([row, cell]) => board[row][cell]);

			if (a === 2 && b === 2 && c === 0) return combination[2].map((cell) => cell);
			if (a === 2 && c === 2 && b === 0) return combination[1].map((cell) => cell);
			if (b === 2 && c === 2 && a === 0) return combination[0].map((cell) => cell);
		}

		return [0, 0];
	},

	canWin: (board: number[][]) => {
		// Check, if the bot has an immediate chance to win
		// If the bot has two out of three cells in a row and the third cell is empty, return true

		for (const combination of winningCombinations) {
			const [a, b, c] = combination.map(([row, cell]) => board[row][cell]);

			if (a === 2 && b === 2 && c === 0) return true;
			if (a === 2 && c === 2 && b === 0) return true;
			if (b === 2 && c === 2 && a === 0) return true;
		}

		return false;
	},

	preventUserWin: (board: number[][]) => {
		// Prevent the user from winning by returning the third (empty) cell in a row of two cells that the user has
		// If the user has two out of three cells in a row and the third cell is empty, return the coordinates of the third cell

		for (const combination of winningCombinations) {
			const [a, b, c] = combination.map(([row, cell]) => board[row][cell]);

			if (a === 1 && b === 1 && c === 0) return combination[2].map((cell) => cell);
			if (a === 1 && c === 1 && b === 0) return combination[1].map((cell) => cell);
			if (b === 1 && c === 1 && a === 0) return combination[0].map((cell) => cell);
		}

		return [0, 0];
	},

	canPreventUserWin: (board: number[][]) => {
		// Check, if the bot can prevent the user from winning
		// If the user has two out of three cells in a row and the third cell is empty, return true

		for (const combination of winningCombinations) {
			const [a, b, c] = combination.map(([row, cell]) => board[row][cell]);

			if (a === 1 && b === 1 && c === 0) return true;
			if (a === 1 && c === 1 && b === 0) return true;
			if (b === 1 && c === 1 && a === 0) return true;
		}

		return false;
	},

	corner: (board: number[][]) => {
		const freeCorners = [
			[0, 0],
			[0, 2],
			[2, 0],
			[2, 2],
		].filter(([row, cell]) => board[row][cell] === 0);

		return freeCorners[Math.floor(Math.random() * freeCorners.length)];
	},

	edge: (board: number[][]) => {
		const freeEdges = [
			[0, 1],
			[1, 0],
			[1, 2],
			[2, 1],
		].filter(([row, cell]) => board[row][cell] === 0);

		return freeEdges[Math.floor(Math.random() * freeEdges.length)];
	},

	random: (board: number[][]) => {
		const freeCells = [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 0],
			[1, 1],
			[1, 2],
			[2, 0],
			[2, 1],
			[2, 2],
		].filter(([row, cell]) => board[row][cell] === 0);

		return freeCells[Math.floor(Math.random() * freeCells.length)];
	},
};

const env = await load({export: true});

const rest = new REST().setToken(env.TOKEN);

const client = new Client({intents: []});

client.on(Events.ClientReady, (client) => {
	console.log(`Logged in as ${client.user?.tag}`);

	// Register commands
	(async () => {
		try {
			console.log("Registering commands");

			await rest.put(Routes.applicationCommands(client.user.id), {
				body: [
					new SlashCommandBuilder() //
						.setName("credits")
						.setDescription("Show credits"),

					new SlashCommandBuilder() //
						.setName("tictactoe")
						.setDescription("Play a game of TicTacToe against the bot")
						.addBooleanOption(
							new SlashCommandBooleanOption() //
								.setName("public")
								.setDescription("Make the game public?")
								.setRequired(false)
						)
						.addStringOption((option) =>
							option.setName("difficulty").setDescription("The difficulty of the bot").setRequired(false).addChoices(
								{
									name: "Easy",
									value: "easy",
								},
								{
									name: "Medium",
									value: "medium",
								},
								{
									name: "Hard",
									value: "hard",
								}
							)
						),
				],
			});

			console.log("Commands registered");
		} catch (error) {
			console.error(error);
		}
	})();
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isCommand()) return;

	const {commandName} = interaction;

	switch (commandName) {
		case "credits": {
			// This bot is made by [DNA](https://dnascanner.de). This project is open source :purple_heart: [GitHub](https://github.com/DNAScanner/discord-tictactoe-bot)
			await interaction.reply({
				ephemeral: true,
				embeds: [
					new EmbedBuilder() //
						.setTitle("Credits")
						.setDescription("This bot is made by [DNA](https://dnascanner.de). This project is open source :purple_heart:"),
				],
				components: [
					new ActionRowBuilder().addComponents([
						new ButtonBuilder() //
							.setLabel("GitHub")
							.setStyle(ButtonStyle.Link)
							.setURL("https://github.com/DNAScanner/discord-tictactoe-bot")
							.setEmoji({id: "1255134516016578630"}),
					]),
				],
			});

			break;
		}

		case "tictactoe": {
			const publicGame = (interaction.options.get("public")?.value || false) as boolean;
			const difficulty = (interaction.options.get("difficulty")?.value || "medium") as string;

			await interaction.reply({ephemeral: !publicGame, content: "Initializing game..."});

			// Initialize game
			const board = [
				//
				[0, 0, 0],
				[0, 0, 0],
				[0, 0, 0],
			];

			// User is always X or 1, bot is always O or 2
			let currentPlayer = 1;

			// Game loop
			while (true) {
				// Display board
				const generateBoardButtons = (board: number[][], restartButton?: boolean) => {
					const rows: ActionRowBuilder<AnyComponentBuilder>[] = [];

					for (const row in board) {
						const dRow = board[row];
						const buttons: ButtonBuilder[] = [];

						for (const cell in board[row]) {
							const dCell = dRow[cell];

							const emote: APIMessageComponentEmoji = {};

							switch (dCell) {
								case 0:
									emote.id = "1254851573536915506";
									break;

								case 1:
									emote.id = "1254851574916841502";
									break;

								case 2:
									emote.id = "1254851576506613832";
									break;
							}

							buttons.push(
								new ButtonBuilder() //
									.setCustomId(`field-${row}-${cell}`)
									// .setLabel(dCell === 0 ? "-" : dCell === 1 ? "X" : "O".toString())
									.setEmoji(emote)
									.setStyle(ButtonStyle.Primary)
									.setDisabled(dCell !== 0 || currentPlayer !== 1 || restartButton === true)
							);
						}

						rows.push(new ActionRowBuilder().addComponents(buttons));
					}

					if (restartButton) rows.push(new ActionRowBuilder().addComponents([new ButtonBuilder().setCustomId("restart").setLabel("Restart").setStyle(ButtonStyle.Danger)]));

					return rows;
				};

				const response = await interaction.editReply({
					content: "**" + (currentPlayer === 1 ? "Please make your move!" : "I'm thinking...") + "**",
					components: [...generateBoardButtons(board)],
				});

				if (currentPlayer === 1) {
					// deno-lint-ignore no-explicit-any
					const filter = (i: any) => i.user.id === interaction.user.id && i.customId.startsWith("field-");

					// Wait for user input
					try {
						const choice = (await response.awaitMessageComponent({
							filter,
							time: 60000,
						})) as AwaitMessageComponentResult;

						await choice.deferUpdate();

						// Parse choice
						const [_, row, cell] = choice.customId.split("-").map(Number);
						board[row][cell] = currentPlayer;
					} catch {
						await interaction.editReply({content: "You took too long to make your move!", components: []});
						break;
					}
				} else {
					switch (difficulty) {
						case "easy": {
							// Use center and random
							let placeAt = [0, 0];

							if (board[1][1] === 0) {
								placeAt = [1, 1];
							} else {
								placeAt = chooseCell.random(board);
							}

							const [row, cell] = placeAt;
							board[row][cell] = currentPlayer;

							break;
						}

						case "medium": {
							// Use canWin, win, canPreventUserWin, preventUserWin, center or random
							let placeAt = [0, 0];

							/*  */ if (chooseCell.canWin(board)) {
								placeAt = chooseCell.win(board);
							} else if (chooseCell.canPreventUserWin(board)) {
								placeAt = chooseCell.preventUserWin(board);
							} else if (board[1][1] === 0) {
								placeAt = [1, 1];
							} else {
								placeAt = chooseCell.random(board);
							}

							const [row, cell] = placeAt;
							board[row][cell] = currentPlayer;

							break;
						}

						case "hard": {
							let placeAt = [0, 0];

							/*  */ if (chooseCell.canWin(board)) {
								placeAt = chooseCell.win(board);
							} else if (chooseCell.canPreventUserWin(board)) {
								placeAt = chooseCell.preventUserWin(board);
							} else if (board[1][1] === 0) {
								placeAt = [1, 1];
							} else if (board[0][0] === 0 || board[0][2] === 0 || board[2][0] === 0 || board[2][2] === 0) {
								placeAt = chooseCell.corner(board);
							} else if (board[0][1] === 0 || board[1][0] === 0 || board[1][2] === 0 || board[2][1] === 0) {
								placeAt = chooseCell.edge(board);
							} else {
								placeAt = chooseCell.random(board);
							}

							const [row, cell] = placeAt;
							board[row][cell] = currentPlayer;

							break;
						}
					}
				}

				// Check if the board is full => draw
				if (!board.flat().includes(0)) {
					await interaction.editReply({content: "**" + pickRandomPhrase("draw") + "**", components: [...generateBoardButtons(board, true)]});

					try {
						const restartChoice = (await response.awaitMessageComponent({
							// deno-lint-ignore no-explicit-any
							filter: (i: any) => i.user.id === interaction.user.id && i.customId === "restart",
							time: 60000,
						})) as AwaitMessageComponentResult;

						await restartChoice.deferUpdate();

						// Reset board
						for (const row of board) row.fill(0);

						continue;
					} catch {
						await interaction.editReply({content: "You took too long to restart the game!", components: []});
						break;
					}
				}

				// Check if someone won
				for (const combination of winningCombinations) {
					const [a, b, c] = combination.map(([row, cell]) => board[row][cell]);

					if (a === b && b === c && a !== 0) {
						await interaction.editReply({content: "**" + pickRandomPhrase(currentPlayer === 1 ? "user" : "bot") + "**", components: [...generateBoardButtons(board, true)]});

						try {
							const restartChoice = (await response.awaitMessageComponent({
								// deno-lint-ignore no-explicit-any
								filter: (i: any) => i.user.id === interaction.user.id && i.customId === "restart",
								time: 60000,
							})) as AwaitMessageComponentResult;

							await restartChoice.deferUpdate();

							// Reset board
							for (const row of board) row.fill(0);

							continue;
						} catch {
							await interaction.editReply({content: "You took too long to restart the game!", components: []});
							break;
						}
					}
				}

				// Switch players
				currentPlayer = currentPlayer === 1 ? 2 : 1;
			}
		}
	}
});

client.login(env.TOKEN);
