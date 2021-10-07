import { config } from 'dotenv';
config();

import { Client, Intents, MessageEmbed } from 'discord.js';
import { connection, Gwei, initialize, SlugSubscription } from './database';
import OpenSeaClient from './opensea';

const openSeaClient = new OpenSeaClient();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});

initialize();

client.on('ready', () => {
    console.log(`Ready! Logged in as ${client.user!.tag}!`);
});

client.on('interactionCreate', async (interaction) => {

    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'floor-price') {

        interaction.deferReply();
        const slugSubscriptions = await connection.getRepository(SlugSubscription).find();
        if (slugSubscriptions.length === 0) {
            return interaction.reply({
                content: 'You do not have any collections saved in your watch list!'
            });
        }
        const floorPrices = new Map();
        const floorPricesPromises = slugSubscriptions.map(async (subscription) => {
            const { floorPrice } = await openSeaClient.getSlugStats(subscription.slug);
            floorPrices.set(subscription.slug, floorPrice);
        });
        await Promise.all(floorPricesPromises);
        const embed = new MessageEmbed()
            .setAuthor('Floor Prices 📈')
            .setDescription(Array.from(floorPrices.entries()).map(([ slugName, floorPrice ]) => {
                return `[${slugName}](https://opensea.io/collections/${slugName}): **${floorPrice}**`;
            }).join('\n'));
        return void interaction.followUp({
            embeds: [embed]
        });
    }

    if (interaction.commandName === 'add-slug') {
        const slug = interaction.options.getString('slug')!;
        const slugSubscriptions = await connection.getRepository(SlugSubscription).find();
        if (slugSubscriptions.some((sub) => sub.slug === slug)) {
            return interaction.reply({
                content: 'This slug is already in your watch list! ⚠️'
            });
        } else {
            await connection.getRepository(SlugSubscription).create({
                slug,
                discordUserId: interaction.user.id,
                createdAt: Date.now()
            });
            return interaction.reply({
                content: 'This slug has been added to your watch list! ✅'
            });
        }
    }

    if (interaction.commandName === 'rem-slug') {
        const slug = interaction.options.getString('slug')!;
        const slugSubscriptions = await connection.getRepository(SlugSubscription).find();
        if (slugSubscriptions.some((sub) => sub.slug === slug)) {
            return interaction.reply({
                content: 'This slug is not in your watch list! ⚠️'
            });
        } else {
            await connection.getRepository(SlugSubscription).delete({
                slug
            });
            return interaction.reply({
                content: 'This slug has been removed from your watch list! ✅'
            });
        }
    }

    if (interaction.commandName === 'set-max-gwei') {
        const gwei = interaction.options.getInteger('gwei')!;
        const currentGwei = await connection.getRepository(Gwei).find();
        if (currentGwei.length === 0) {
            await connection.getRepository(Gwei).create({
                value: gwei
            });
        } else {
            await connection.getRepository(Gwei).update({}, {
                value: gwei
            });
        }
        return interaction.reply({
            content: `Max gwei for Etherum has been set to **${gwei} gwei**!`
        });
    }

});

client.login(process.env.DISCORD_CLIENT_TOKEN);
