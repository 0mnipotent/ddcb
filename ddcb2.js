const { Telegraf } = require('telegraf')
const mysql = require('mysql2/promise')
const connection = mysql.createConnection({
      host: 'localhost',
      user: 'ddcb',
      password: '8hcvHYV6VwCv',
      database: 'ddcb'
})

const bot = new Telegraf('5642618740:AAHk-SyOdwPLsd86pUef8UQF4Mv6AUu0l3Y');

bot.command('register', async ctx => {
    const { id,  username } = ctx.from;
    const created_at = new Date();
    let sql = `INSERT INTO users (user_id, username, created_at) VALUES (${id}, '${username}', '${created_at}')`;
    connection.query(sql, values, function (err, rows, fields) {
	ctx.reply(`You have been registered!`);
    })
} catch (err) {
    console.log(err);
    ctx.reply('There was an error registering you. Please try again later.');
});

bot.launch();

