const { Telegraf } = require('telegraf')
const mysql = require('mysql2/promise')
const pool = mysql.createPool({
    host: 'localhost',
    user: 'ddcb',
    password: '8hcvHYV6VwCv',
    database: 'ddcb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const bot = new Telegraf('5642618740:AAHk-SyOdwPLsd86pUef8UQF4Mv6AUu0l3Y');

bot.command('register', async ctx => {
    const { id,  username } = ctx.from;
    const created_at = new Date();
    try {
        let checkSql = `SELECT * FROM users WHERE user_id = ${id}`;
        const [rows, fields] = await pool.query(checkSql);
        if (rows.length > 0) {
            ctx.reply(`You are already registered, ${username}!`);
            return;
        }

        let sql = `INSERT INTO users (user_id, username, created_at) VALUES (${id}, '${username}', '${created_at}')`;
        const [result, insertFields] = await pool.query(sql);
        ctx.reply(`You have been registered, ${username}!`);
    } catch (err) {
        console.log(err);
        ctx.reply('There was an error registering you. Please try again later.');
    }
});



bot.command('add', async ctx => {
    ctx.reply('What note would you like to add?');
    bot.on('message', async (ctx) => {
        const { id, username } = ctx.from;
        const note = ctx.message.text;

        try {
            let sql = `INSERT INTO notes (user_id, note) VALUES (${id}, '${note}')`;
            const [result, insertFields] = await pool.query(sql);
            ctx.reply(`Note added successfully, ${username}!`);
        } catch (err) {
            console.log(err);
            ctx.reply('There was an error adding the note. Please try again later.');
        }
    });
});



bot.command('display', async ctx => {
    try {
        let sql = `SELECT username FROM users`;
        const [rows, fields] = await pool.query(sql);
        var usernames = rows.map(row => row.username)
        ctx.reply("Please select a username: \n" + usernames.join("\n"));
    } catch (err) {
        console.log(err);
        ctx.reply('There was an error fetching the users. Please try again later.');
    }
    bot.on('message',async (ctx) => {
	const selectedUsername = ctx.message.text;
	try {
	    let sql = `SELECT notes.note_id, notes.note, users.username FROM notes JOIN users ON notes.user_id = users.user_id WHERE users.username = '${selectedUsername}'`;
	    const [rows, fields] = await pool.query(sql);
	    if (rows.length > 0) {
		rows.forEach(row => {
		    ctx.reply(`Note ID: ${row.id} \nAuthor: ${selectedUsername} \nNote: ${row.note}`);
	        });
	    } else {
		ctx.reply(`No notes found for user: ${selectedUsername}`);
	    }
	} catch (err) {
	    console.log(err);
	    ctx.reply('There was an error fetching the notes. Please try again later.');
	}
    });
});


bot.command('search', async ctx => {
    ctx.reply("Please enter the keywords you would like to search for:");
    bot.on('message', async (ctx) => {
        const keywords = ctx.message.text;
        try {
            let sql = `SELECT notes.note_id, notes.note, users.username FROM notes JOIN users ON notes.user_id = users.user_id WHERE notes.note LIKE '%${keywords}%'`;
            const [rows, fields] = await pool.query(sql);
            if (rows.length > 0) {
                rows.forEach(row => {
                    ctx.reply(`Note ID: ${row.note_id} \nAuthor: ${row.username} \nNote: ${row.note}`);
                });
            } else {
                ctx.reply(`No notes found containing: ${keywords}`);
            }
        } catch (err) {
            console.log(err);
            ctx.reply('There was an error searching the notes. Please try again later.');
        }
    });
});





bot.command('remove', async ctx => {
    ctx.reply("What is the ID of the note you would like to remove?");
    bot.on('message', async (ctx) => {
	try {
	    const note_id = await ctx.message.text;
            const { id } = ctx.from;
            let sql = `DELETE FROM notes WHERE user_id = ${id} AND note_id = ${note_id}`;
            const [result, fields] = await pool.query(sql);
            ctx.reply(`Note with ID ${note_id} has been removed`);
        } catch (err) {
            console.log(err);
            ctx.reply('There was an error removing the note. Please make sure you entered a valid note ID and that you are the author of the note.');
        }
    });
});







bot.launch();

