# Floor Price Bot

Commands:

- /add-slug : adds a collection to the floor-price command (by its slug)
- /rem-slug : removes a collection from the floor-price command (by its slug)
- /floor-price : fetches the floor prices from open sea and the crypto punk website and sends them on Discord
- /set-max-gwei : changes the gwei threshold to send announcements

The bot will send a @everyone notification when the max gwei is reached, and will show it in its status 

## How to install?

To install the bot on a server/computer, you will need:

* Node.js/NPM
* PostgreSQL

Run the following commands:

* `npm install`
* `npm run build`
* `node .`

and you are done! You can also use a process manager such as PM2.
