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
       
	if (command === "play") {
	if (queue[message.guild.id] === undefined) return message.channel.sendMessage(`Add some songs to the queue first with ${tokens.prefix}add`);
		if (!message.guild.voiceConnection) return commands.join(]message).then(() => commands.play(]message));
		if (queue[message.guild.id].playing) return message.channel.sendMessage('Already Playing');
		let dispatcher;
		queue[message.guild.id].playing = true;
	}
});
