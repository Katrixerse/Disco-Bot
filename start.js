const Discord = require("discord.js");
const client = new Discord.Client();
const YoutubeDL = require('youtube-dl');
const ytdl = require('ytdl-core');
const sql = require("sqlite");
sql.open("./assets/guildsettings.sqlite");

const config = require("./assets/config.json");

fs.readdir('./events/', (err, files) => {
    files = files.filter(eventtograb => eventtograb.endsWith('.js'));
    files.forEach(eventtograb => {
        const event = require(`./events/${eventtograb}`);
        client.on(eventtograb.split('.')[0], event.bind(null, client));
        delete require.cache[require.resolve(`./events/${eventtograb}`)];
    });
});

client.on("message", async (message) => {
    if (message.author.bot) return;
    if (message.channel.type === 'dm') return; // so users cant try to use voice channel in dms as voice channels dont exist
    if (message.content.indexOf(config.prefix) !== 0) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    try {
        let commandFile = require(`./commands/${command}.js`);
        commandFile.run(client, message, args);
    } catch (err) {
        return;
    }
});
