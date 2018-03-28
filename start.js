const Discord = require("discord.js");
const yt = require('ytdl-core');
const snekfetch = require('snekfetch');
const sql = require("sqlite");
sql.open("./assets/guildsettings.sqlite");
const client = new Discord.Client();
const logschannel = "mod-logs" // change this too the logs channel you want to use.
let dispatcher;

if (Number(process.version.slice(1).split(".")[0]) < 8) {
	console.log("Node 8.0.0 or higher is required. Update Node on your system.");
}

let queue = {};

client.on('uncaughtException', (err) => {
	console.log("error", "Uncaught Exception", err);
});

process.on("unhandledRejection", (err) => {
	console.log("Uncaught Promise Error", err);
});

client.on('disconnect', () => console.warn('Disconnected!'))

client.on('reconnecting', () => console.warn('Reconnecting...'))

client.on('ready', () => {
	client.user.setPresence({
        game: {
            name: `${client.guilds.size} servers`, // Change what the bot is watching or playing.
            type: 3 // 0 for playing, 1 for streaming, 2 for listening and 3 for watching.
        }
    });
	console.log('ready!');
});

client.on("guildCreate", guild => {
	console.log(`Someone added disco-bot to their discord! ${guild.name} Member count: ${guild.memberCount}!`)

	sql.get(`SELECT * FROM scores WHERE guildId ="${guild.id}"`).then(row => {
		if (!row) {
			sql.run("INSERT INTO scores (guildId, prefix) VALUES (?, ?)", [guild.id, ">"]);
		}
	}).catch(() => {
		console.error;
		sql.run("CREATE TABLE IF NOT EXISTS scores (guildId TEXT, prefix TEXT)").then(() => {
			sql.run("INSERT INTO scores (guildId, prefix) VALUES (?, ?)", [message.author.id, ">"]);
		});
	});
});

client.on("message", async (message) => {
	if (message.author.bot) return;
	if (message.channel.type === 'dm') return;
	if (!message.guild.member(client.user).hasPermission('SEND_MESSAGES')) return;
	if (!message.guild.member(client.user).hasPermission('VIEW_CHANNEL')) return;
	

	sql.get(`SELECT * FROM scores WHERE guildId ="${message.guild.id}"`).then(async (row) => {
		if (!row) return;

		const prefix = row.prefix
		if (row.prefix === undefined) return prefix = ">"
		if (message.content.indexOf(prefix) !== 0) return;
		const args = message.content.slice(prefix.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		
		if (command === "play") {
			if (!message.guild.member(client.user).hasPermission('CONNECT')) return message.reply('Sorry, i dont have the perms to do this cmd i need CONNECT. :x:')
			if (!message.guild.member(client.user).hasPermission('SPEAK')) return message.reply('Sorry, i dont have the perms to do this cmd i need SPEAK. :x:')
			const channel = message.member.voiceChannel;
			if (!channel || channel.type !== 'voice') return message.reply('I couldn\'t connect to your voice channel...');
			if (queue[message.guild.id] === undefined) return message.channel.send(`Add some songs to the queue first with add`);
			if (!message.guild.voiceConnection) {
				channel.join()
			}
			if (queue[message.guild.id].playing) return message.channel.send('Already Playing the queue.');
			queue[message.guild.id].playing = true;
			(function play(song) {
				if (song === undefined) return message.channel.send('Queue is empty, disconnecting till more is queued.').then(() => {
					queue[message.guild.id].playing = false;
					message.member.voiceChannel.leave();
				});
				console.log(song.title + " in " + message.guild.name);
				message.channel.send(`Playing: **${song.title}** as requested by: **${song.requester}**`);
				dispatcher = message.guild.voiceConnection.playStream(yt(song.url, {
					audioonly: true
				}), {
					seek: 0,
					passes: 1, // Can be increased to reduce packetloss.
					bitrate: 'auto',
					quality: 'highestaudio'
				});
				dispatcher.on('end', () => {
					play(queue[message.guild.id].songs.shift());
				});
				dispatcher.on('error', (err) => {
					return message.channel.send('error: ' + err).then(() => {
						play(queue[message.guild.id].songs.shift());
					});
				});
			})(queue[message.guild.id].songs.shift());
		}

		if (command === "add") {
			let query = args.join(" ");
			if (query < 1) return message.channel.send('You must include a query for what you want to play, add [songname/url]')
			const msg = await message.channel.send("Searching...")
			if (query.includes("youtube.com/watch")) {
				let url = query
				yt.getInfo(url, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
					if (err) return message.channel.send('Invalid YouTube Link: ' + err);
					if (!queue.hasOwnProperty(message.guild.id)) queue[message.guild.id] = {}, queue[message.guild.id].playing = false, queue[message.guild.id].songs = [];
					queue[message.guild.id].songs.push({
						url: url,
						title: info.title,
						requester: message.author.username
					});
					msg.edit(`Added **${info.title}** to the queue`);
				});
			} else {
				const {
					body
				} = await snekfetch
					.get('https://www.googleapis.com/youtube/v3/search')
					.query({
						part: 'snippet',
						type: 'video',
						maxResults: 1,
						q: query,
						safeSearch: 'strict', // Dont want users playing 18+ vids
						order: 'relevance',
						videoDuration: 'medium', // Can be changed to short, medium or long, i set it to medium so users couldnt play music over 20mins 
						key: "Google api key"
					});
				if (!body.items.length) return message.channel.send('No results found for ' + query + ".");
				let url = `https://www.youtube.com/watch?v=${body.items[0].id.videoId}`
				yt.getInfo(url, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
					if (err) return message.channel.send('Invalid YouTube Link: ' + err);
					if (!queue.hasOwnProperty(message.guild.id)) queue[message.guild.id] = {}, queue[message.guild.id].playing = false, queue[message.guild.id].songs = [];
					queue[message.guild.id].songs.push({
						url: url,
						title: info.title,
						requester: message.author.username
					});
					info
					msg.edit(`Added **${info.title}** to the queue`);
				});
			}
		}

		if (command === "join") {
				const voiceChannel = message.member.voiceChannel;
				if (!voiceChannel || voiceChannel.type !== 'voice') return message.reply('I couldn\'t connect to your voice channel...');
				voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
		}

		if (command === "leave") {
				const voiceChannel = message.member.voiceChannel;
				if (!voiceChannel || voiceChannel.type !== 'voice') return message.reply('I couldn\'t leave your voice channel...');
				voiceChannel.leave()
		}

		if (command === "queue") {
			if (queue[message.guild.id] === undefined || queue[message.guild.id] === {}) return message.channel.send(`Add some songs to the queue first with add`);
			let tosend = [];
			queue[message.guild.id].songs.forEach((song, i) => {
				tosend.push(`${i+1}. ${song.title} - Requested by: ${song.requester}`);
			});
			if (tosend.length <= 0) return message.channel.send(`**${message.guild.name}'s Music Queue:** Currently **${tosend.length}** queued.`);
			message.channel.send(`**${message.guild.name}'s Music Queue:** Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
		}

		if (command === "clearqueue") {
			if (queue === {}) return message.channel.send('Queue is empty, have no songs to remove.');
			const voiceChannel = message.member.voiceChannel;
			if (!voiceChannel || voiceChannel.type !== 'voice') return message.reply('I couldn\'t leave your voice channel...');
			queue[message.guild.id] = {};
			message.channel.send('Queue has been cleared, use >add to start playing music again.')
			voiceChannel.leave()
		}

		if (command === "pause") {
			dispatcher.pause();
			message.channel.send('Music has been paused, use >resume to start playing music again.')
		}

		if (command === "resume") {
			dispatcher.resume();
			message.channel.send('Music has been resumed.')
		}

		if (command === "skip") {
			if (queue === {}) return message.channel.send('Queue is empty, have no songs to skip.');
			message.channel.send('Current song has been skipped.')
			dispatcher.end();
		}

		if (command === "volume") {
			const volumetoset = parseInt(args.join(""))
			if (volumetoset > 200 || volumetoset < 0) return message.channel.send('Volume out of range!').then((response) => {
				response.delete(5000);
			});
			if (isNaN(volumetoset)) return message.channel.send("Need to provide a valid number.")
			dispatcher.setVolume(volumetoset / 100);
			message.channel.send(`Volume now set too: ${volumetoset}%`);
		}

		if (command === "help") {
			const embed = new Discord.RichEmbed()
			.setColor(0x738BD7)
			.setTitle("Commands list")
			.addField("add [query/url]", "Will add a song to the queue.")
			.addField("play ", "Will play the song(s) in the queue.")
			.addField("volume [number] ", "Will set the volume to [number].")
			.addField("pause ", "Will pause the current playing song. the volume to [number].")
			.addField("resume", "Will resume the last playing song.")
			.addField("queue", "Will send all the current songs in the queue.")
			.addField("clearqueue", "Will remove all the current songs in the queue.")
			.addField("join", "Will join the current voice channel your in.")
			.addField("leave", "Will leave the current voice channel your in.")
		message.author.send({embed})
		}

		if (command === "prefix") {
			if (!message.member.hasPermission("MANAGE_GUILD")) return message.channel.send("You are missing MANAGE_GUILD permission");
			const newprefix = args[0]
			const newprefixfix = newprefix.replace(/[^\x00-\x7F]/g, "");
			if (newprefix.length < 1) return message.channel.send("Didn't provide a new prefix to set")
            var asciic = /[^\x00-\x7F]/g;
            const result = asciic.test(newprefix)
            if (result === true) return message.channel.send("Prefix cant include ascii characters.")
			if (newprefix.length > 7) return message.channel.send("prefix can't be longer then 7 characters")
			sql.get(`SELECT * FROM scores WHERE guildId ="${message.guild.id}"`).then(row => {
				sql.run(`UPDATE scores SET prefix = "${newprefixfix}" WHERE guildId = ${message.guild.id}`);
				message.channel.send("I have set the new guild prefix to " + newprefix)
				let modlog = message.guild.channels.find('name', logschannel);
				const embed = new Discord.RichEmbed()
					.setColor(0x738BD7)
					.setTitle("Action: Prefix Change")
					.addField("Moderator", message.author.tag + " (ID: " + message.author.id + ")")
					.addField("New prefix", newprefixfix, true)
					.setFooter("Time used: " + message.createdAt.toDateString())
				if (!modlog) return;
				return client.channels.get(modlog.id).send({
					embed
				});
			})
		}
	})
});

client.login("Your token");
