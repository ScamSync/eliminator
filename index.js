require('dotenv').config();require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});

const token = process.env.BOT_TOKEN;
const channelId = process.env.CHANNEL_ID; // Ensure this is set in your .env file
const reactionEmoji = '✅'; // The emoji used for reactions

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('ss.start') && message.channel.id === channelId) {
        const args = message.content.split(' ');

        // Default values
        let duration = 60; // Default duration in seconds
        let reason = 'Join the game!'; // Default reason

        // Check for custom duration
        if (args[1] && !isNaN(args[1])) {
            duration = parseInt(args[1]);
        }

        // Check for custom reason
        if (args.length > 2) {
            reason = args.slice(2).join(' ');
        }

        // Send the initial message
        const initialEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Eliminator Game')
            .setDescription(`React with ✅ within ${duration} seconds to join the game! 🎮\n\nReason: ${reason}\n\nGot to be in it to win it! 🏆`);

        const gameMessage = await message.channel.send({ embeds: [initialEmbed] });

        // Add the reaction
        await gameMessage.react(reactionEmoji);

        // Send a warning message halfway through the duration
        setTimeout(() => {
            const warningEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Hurry Up!')
                .setDescription(`The game starts in ${duration / 2} seconds! React quickly! ⏰`);
            message.channel.send({ embeds: [warningEmbed] });
        }, duration * 500); // Half of the total duration in milliseconds

        // Collect reactions for the specified duration
        const filter = (reaction, user) => reaction.emoji.name === reactionEmoji && !user.bot;
        const collectedReactions = await gameMessage.awaitReactions({ filter, time: duration * 1000 });

        const players = collectedReactions.get(reactionEmoji)?.users.cache.filter(user => !user.bot).map(user => user.id) || [];

        if (players.length < 1) {
            message.channel.send('No one joined the game! 😢');
            return;
        }

        message.channel.send(`Game is starting with ${players.length} players! Good luck everyone! 🍀`);

        // Game logic: randomly eliminate players until one is left
        let remainingPlayers = [...players];
        while (remainingPlayers.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between eliminations
            const eliminatedPlayer = remainingPlayers.splice(Math.floor(Math.random() * remainingPlayers.length), 1)[0];
            message.channel.send(`<@${eliminatedPlayer}> has been eliminated! 💔`);
        }

        message.channel.send(`🎉 Congratulations <@${remainingPlayers[0]}>! You are the winner! 🏆`);
    }
});

client.login(token).catch(console.error);