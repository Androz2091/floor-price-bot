const { config } = require('dotenv');
config();

const { REST } = require('@discordjs/rest');
const { Routes, ApplicationCommandOptionType } = require('discord-api-types/v9');

const commands = [{
    name: 'floor-price',
    description: 'Gets the floor price of the saved slugs from OpenSea!'
},
{
    name: 'add-slug',
    description: 'Adds a slug to your watch list (used for the /floor-price command)',
    options: [
        {
            name: 'slug',
            description: 'The slug to add to the watch list',
            type: ApplicationCommandOptionType.String
        }
    ]
},
{
    name: 'rem-slug',
    description: 'Removes a slug from your watch list (used for the /floor-price command)',
    options: [
        {
            name: 'slug',
            description: 'The slug to remove from the watch list',
            type: ApplicationCommandOptionType.String
        }
    ]
},
{
    name: 'set-max-gwei',
    description: 'Sets the max ethereum gwei price (when above, a message will be sent)',
    options: [
        {
            name: 'gwei',
            description: 'The new max gwei',
            type: ApplicationCommandOptionType.Integer
        }
    ]
}];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_CLIENT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands }
        ).then(console.log);

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();