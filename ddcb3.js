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
        let sql = `INSERT INTO users (user_id, username, created_at) VALUES (${id}, '${username}', '${created_at}')`;
        const [rows, fields] = await pool.query(sql);
        ctx.reply(`You have been registered, ${username}!`);
    } catch (err) {
        console.log(err);
        ctx.reply('There was an error registering you. Please try again later.');
    }
});

bot.launch();

