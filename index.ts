import { config } from 'dotenv';
config();

import { Client, Intents, MessageEmbed, TextChannel } from 'discord.js';
import { connection, Gwei, GweiStatus, initialize, LastSavedPrice, SlugSubscription } from './database';
import { OpenSeaClient } from './opensea';
import { fetchLastPrice, fetchGasPrice } from './ethereum';
import { fetchFloorPrice } from './cryptopunk';

const openseaClient = new OpenSeaClient();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});

client.on('ready', async () => {
    console.log(`Ready! Logged in as ${client.user!.tag}!`);

    await initialize();

    const synchronizeFetchPrice = () => {
        fetchGasPrice().then(async (price) => {
            client.user?.setActivity(`${price} GWEI`);

            const maxGwei = await connection.getRepository(Gwei).findOne();
            if (!maxGwei) console.log('No max gwei defined...');
            if (maxGwei) {
                const gweiStatus = await connection.getRepository(GweiStatus).findOne();
                if (maxGwei.value > price && gweiStatus?.alreadySent) {
                    console.log('Max gwei ready to be sent!');
                    await connection.getRepository(GweiStatus).update({}, {
                        alreadySent: false
                    });
                } else if (maxGwei.value < price && !gweiStatus?.alreadySent) {
                    console.log('Max gwei ready sent!');
                    (client.channels.cache.get(process.env.DISCORD_GWEI_NOTIF_CHANNEL_ID!) as TextChannel).send({
                        content: `@everyone\nMax GWEI (${maxGwei.value}) has been reached! It is now at **${price}**!`
                    });
                    if (!gweiStatus) {
                        await connection.getRepository(GweiStatus).insert({
                            alreadySent: true
                        });
                    } else {
                        await connection.getRepository(GweiStatus).update({}, {
                            alreadySent: true
                        }); 
                    }
                }
            }
        });
    };

    setTimeout(() => synchronizeFetchPrice(), 1000);
    setInterval(() => {
        synchronizeFetchPrice();
    }, 30_000);
});

client.on('interactionCreate', async (interaction) => {

    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'floor-price') {

        interaction.deferReply();
        const price = await fetchLastPrice() || 0;
        const slugSubscriptions = await connection.getRepository(SlugSubscription).find();
        const floorPrices = new Map<string, { floorPrice: number; difference?: number; }>();
        const cryptoPunk = await fetchFloorPrice();
        const floorPricesPromises = slugSubscriptions.map(async (subscription) => {
            const floorPrice = await openseaClient.floorPrice(subscription.slug);
            const previousFloorPrice = await connection.getRepository(LastSavedPrice).findOne({
                where: {
                    slug: subscription.slug
                }
            });
            if (previousFloorPrice) {
                await connection.getRepository(LastSavedPrice).update({
                    slug: subscription.slug
                }, {
                    price: floorPrice as number,
                    lastSaved: new Date()
                });
            } else {
                await connection.getRepository(LastSavedPrice).insert({
                    slug: subscription.slug,
                    lastSaved: new Date(),
                    price: floorPrice as number
                });
            }
            floorPrices.set(subscription.slug, {
                floorPrice: floorPrice,
                difference: previousFloorPrice ? (floorPrice - previousFloorPrice.price) * 100 : undefined
            });
        });
        await Promise.all(floorPricesPromises);
        const embed = new MessageEmbed()
            .setAuthor('Floor Prices 📈')
            .setDescription(`🔴 Live ETH price: **$${price}**\n\n[crypto-punks](https://www.larvalabs.com/cryptopunks/forsale): **${cryptoPunk}**\n` + Array.from(floorPrices.entries()).sort((a, b) => b[1].floorPrice - a[1].floorPrice).map(([ slugName, { floorPrice, difference } ]) => {
                return `[${slugName}](https://opensea.io/collection/${slugName}): **${floorPrice.toFixed(2)}Ξ** ${difference ? `(**${difference > 0 ? `+${difference.toFixed(0)}**%` : `-${(-1 * difference).toFixed(0)!}**%`})` : ''}`;
            }).join('\n'))
            .setColor('DARK_RED')
            .setFooter('You can add new collections by using /add-project')
        return void interaction.followUp({
            embeds: [embed]
        });
    }

    if (interaction.commandName === 'add-project') {
        const slug = interaction.options.getString('project')!;
        const slugSubscriptions = await connection.getRepository(SlugSubscription).find();
        if (slugSubscriptions.some((sub) => sub.slug === slug)) {
            return interaction.reply({
                content: 'This project is already in your watch list! ⚠️'
            });
        } else {
            await connection.getRepository(SlugSubscription).insert({
                slug,
                discordUserId: interaction.user.id,
                createdAt: new Date()
            });
            return interaction.reply({
                content: 'This project has been added to your watch list! ✅'
            });
        }
    }

    if (interaction.commandName === 'rem-project') {
        const slug = interaction.options.getString('project')!;
        const slugSubscriptions = await connection.getRepository(SlugSubscription).find();
        if (!slugSubscriptions.some((sub) => sub.slug === slug)) {
            return interaction.reply({
                content: 'This project is not in your watch list! ⚠️'
            });
        } else {
            await connection.getRepository(SlugSubscription).delete({
                slug
            });
            return interaction.reply({
                content: 'This project has been removed from your watch list! ✅'
            });
        }
    }

    if (interaction.commandName === 'set-max-gwei') {
        const gwei = interaction.options.getInteger('gwei')!;
        const currentGwei = await connection.getRepository(Gwei).find();
        if (currentGwei.length === 0) {
            await connection.getRepository(Gwei).insert({
                value: gwei
            });
        } else {
            await connection.getRepository(Gwei).update({}, {
                value: gwei
            });
        }
        return interaction.reply({
            content: `Max gwei for Ethereum has been set to **${gwei} gwei**!`
        });
    }

});

client.login(process.env.DISCORD_CLIENT_TOKEN);
