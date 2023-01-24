const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const mysql = require('mysql2/promise')
const pool = mysql.createPool({
    host: 'localhost',
    user: 'USERNAME',
    password: 'PASSWORD',
    database: 'ddcb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const bot = new Telegraf('BOT TOKEN');
const localSession = new LocalSession({
  database: 'session.json'
})

bot.use(localSession.middleware())

bot.use(async (ctx, next) => {
    const { id } = ctx.from;
    try {
        let sql = `SELECT * FROM sessions WHERE user_id = ${id}`;
        const [rows, fields] = await pool.query(sql);
        if (rows.length > 0) {
            ctx.session = {
                user_id: rows[0].user_id,
                username: rows[0].username
            }
        }
    } catch (err) {
        console.log(err);
    }
    await next();
});

bot.command('session', async ctx => {
    try {
        const { id, username } = ctx.from;
        let checkSql = `SELECT * FROM users WHERE user_id = ${id}`;
        const [rows, fields] = await pool.query(checkSql);
        if (rows.length === 0) {
            ctx.reply(`You must register first before starting a session. Use /register to register.`);
            return;
        }
        const start_time = new Date();
        let sql = `INSERT INTO sessions (user_id, username, start_time) VALUES (${id}, '${username}', '${start_time}')`;
        const [result, insertFields] = await pool.query(sql);
        ctx.session.username = result.username;
        ctx.session.user_id = result.user_id;
        ctx.reply(`Session started successfully, ${username}!`);
    } catch (err) {
        console.log(err);
        ctx.reply('There was an error starting the session. Please try again later.');
    }
});

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
        ctx.session.username = username;
        ctx.session.user_id = id;
    } catch (err) {
        console.log(err);
        ctx.reply('There was an error registering you. Please try again later.');
    }
});






bot.command('add', async ctx => {
    if (!ctx.session.username) {
        ctx.reply('You must register first before adding a note. Use /register to register.');
        return;
    }
    ctx.reply('What note would you like to add?');

    let resolvePromise;
    const myPromise = new Promise(resolve => { resolvePromise = resolve; });

    bot.on('message', async (ctx) => {
        await myPromise;
        const { id } = ctx.from;
        if (!ctx.session.user_id) {
            return;
        }
        const note = ctx.message.text;
        try {
            let sql = `INSERT INTO notes (user_id, note) VALUES (${id}, '${note}')`;
            const [result, insertFields] = await pool.query(sql);
            ctx.reply(`Note added successfully, ${ctx.session.username}!`);
            resolve();
        } catch (err) {
            console.log(err);
            ctx.reply('There was an error adding the note. Please try again later.');
            reject();
        }
    });
});


bot.command('display', async ctx => {
    if (!ctx.session.username) {
        ctx.reply('You must register first before displaying notes. Use /register to register.');
        return;
    }
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
        if (!ctx.session.user_id) {
            return
	}
	const selectedUsername = ctx.message.text;
	try {
	    let sql = `SELECT notes.note_id, notes.note, users.username FROM notes JOIN users ON notes.user_id = users.user_id WHERE users.username = '${selectedUsername}'`;
	    const [rows, fields] = await pool.query(sql);
	    if (rows.length > 0) {
		rows.forEach(row => {
		    ctx.reply(`Note ID: ${row.id} \nAuthor: ${selectedUsername} \nNote: ${row.note}`);
		});
	    } else {
		ctx.reply(`No notes found for ${selectedUsername}`);
	    }
	} catch (err) {
	    console.log(err);
	    ctx.reply('There was an error fetching the notes. Please try again later.');
	}
    });
});

bot.command('search', async ctx => {
    if (!ctx.session.username) {
	ctx.reply('You must register first before searching for notes. Use /register to register.');
	return;
    }
    ctx.reply('Enter the search query:');
    bot.on('message', async (ctx) => {
	if (!ctx.session.user_id) {
	    return;
	}
	const searchQuery = ctx.message.text;
	try {
	    let sql = `SELECT notes.note_id, notes.note, users.username FROM notes JOIN users ON notes.user_id = users.user_id WHERE notes.note LIKE '%${searchQuery}%' AND users.user_id = ${ctx.session.user_id}`;
	    const [rows, fields] = await pool.query(sql);
	    if (rows.length > 0) {
		rows.forEach(row => {
		    ctx.reply(`Note ID: ${row.note_id} \nAuthor: ${row.username} \nNote: ${row.note}`);
		});
	    } else {
		ctx.reply(`No notes found matching the search query "${searchQuery}"`);
	    }
	} catch (err) {
	    console.log(err);
	    ctx.reply('There was an error searching for notes. Please try again later.');
	}
    });
});

bot.command('update', async ctx => {
if (!ctx.session.username) {
ctx.reply('You must register first before updating a note. Use /register to register.');
return;
}
ctx.reply('Enter the note ID of the note you want to update:');
bot.on('message', async (ctx) => {
if (!ctx.session.user_id) {
return;
}
const note_id = ctx.message.text;
try {
let checkSql = `SELECT * FROM notes WHERE note_id = ${note_id} AND user_id = ${ctx.session.user_id}`;
const [rows, fields] = await pool.query(
checkSql);
if (rows.length > 0) {
ctx.reply(`What would you like to update the note with?`);
bot.on('message', async (ctx) => {
if (id !== ctx.session.user_id) {
return;
}
const new_note = ctx.message.text;
try {
let sql = `UPDATE notes SET note = '${new_note}' WHERE note_id = ${note_id} AND user_id = ${ctx.session.user_id}`;
const [result, insertFields] = await pool.query(sql);
ctx.reply(`Note updated successfully, ${ctx.session.username}!`);
} catch (err) {
console.log(err);
ctx.reply('There was an error updating the note. Please try again later.');
}
});
} else {
ctx.reply(`Note not found or you are not the author of the note`);
}
} catch (err) {
console.log(err);
ctx.reply('There was an error updating the note. Please try again later.');
}
});
});

bot.command('remove', async ctx => {
if (!ctx.session.username) {
ctx.reply('You must register first before removing a note. Use /register to register.');
return;
}
ctx.reply('Enter the note ID of the note you want to remove:');
bot.on('message', async (ctx) => {
if (id !== ctx.session.user_id) {
return;
}
const note_id = ctx.message.text;
try {
let checkSql = `SELECT * FROM notes WHERE note_id = ${note_id} AND user_id = ${ctx.session.user_id}`;
const [rows, fields] = await pool.query(checkSql);
if (rows.length > 0) {
let sql = `DELETE FROM notes WHERE note_id = ${note_id} AND user_id = ${ctx.session.user_id}`;
const [result, insertFields] = await pool.query(sql);
ctx.reply(`Note removed successfully, ${ctx.session.username}!`);
} else {
ctx.reply(`Note not found or you are not the author of the note.`);
}
} catch (err) {
console.log(err);
ctx.reply('There was an error removing the note. Please try again later.');
}
});
});

bot.launch()

