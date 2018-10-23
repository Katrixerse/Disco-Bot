# Disco-Bot

Hosting

First, download all the files and put them in a folder.

Need to create a new app at https://discordapp.com/developers/applications/me/create and then need to fill out the bots name and select its avatar then create it. Once done that find where is says Bot and click create a bot user and hit yes, do it

Now you want to go back to bot go to token and click token: click to reveal this will show you the bot token now edit start.js where it says, client.login("your token") (it's at the bottom) with your bot token once done click save.

Now you have done that you will need NodeJs installed can get it from https://nodejs.org/en/ so you can start running the bot.

Now right click the folder in an empty space where you put the files in then click open command prompt.

Need to install each of these packages with npm install [packagename] without the brackets and replace package name with the ones below.

Packages Needed

- discord.js
- ytdl-core
- sqlite
- ffmpeg

When done downloading the dependencies, run node start.js.

If there is a problem or an error please make an issue.

If you want to run this bot while not having the console or terminal open, use nodemon or pm2 (ex. pm2 start hammy.js)
