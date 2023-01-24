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

bot.command('register', async ctx => {
  // Check if user is already registered
  const user = await pool.query('SELECT * FROM users WHERE user_id = ?', [ctx.from.id])
  if (user[0].length > 0) {
    ctx.reply('You are already registered!')
    return
  }

  // Register user
  const date = new Date().toUTCString()
  await pool.query('INSERT INTO users (username, created_at, user_id) VALUES (?, ?, ?)', [ctx.from.username, date, ctx.from.id])
  ctx.reply(`Welcome ${ctx.from.username}! You have been registered.`)
})

bot.command('add', async ctx => {
  // Check if user is registered
  const user = await pool.query('SELECT * FROM users WHERE user_id = ?', [ctx.from.id])
  if (user[0].length === 0) {
    ctx.reply('You need to register first!')
    return
  }

  // Add note
  await pool.query('INSERT INTO notes (note, user_id) VALUES (?, ?)', [ctx.message.text, ctx.from.id])
  ctx.reply('Note added!')
})

bot.command('update', async ctx => {
  // Check if user is registered
  const user = await pool.query('SELECT * FROM users WHERE user_id = ?', [ctx.from.id])
  if (user[0].length === 0) {
    ctx.reply('You need to register first!')
    return
  }

  // Update note
  const note = ctx.message.text.split(' ')
  await pool.query('UPDATE notes SET note = ? WHERE note_id = ? AND user_id = ?', [note[1], note[0], ctx.from.id])
  ctx.reply('Note updated!')
})

bot.command('remove', async ctx => {
  // Check if user is registered
  const user = await pool.query('SELECT * FROM users WHERE user_id = ?', [ctx.from.id])
  if (user[0].length === 0) {
    ctx.reply('You need to register first!')
    return
  }

  // Remove note
  const noteId = ctx.message.text
  await pool.query('DELETE FROM notes WHERE note_id = ? AND user_id = ?', [noteId, ctx.from.id])
  ctx.reply('Note removed!')
})

bot.command('search', async ctx => {
  // Check if user is registered
  const user = await pool.query('SELECT * FROM users WHERE user_id = ?', [ctx.from.id])
  if (user[0].length === 0) {
    ctx.reply('You need to register first!')
    return
  }

  // Search notes
  const keyword = ctx.message.text
  const notes = await pool.query('SELECT * FROM notes WHERE note LIKE ?', ['%' + keyword + '%'])
  if (notes[0].length === 0) {
    ctx.reply('No notes found with that keyword.')
  } else {
    let result = ''
    notes[0].forEach(note => {
      result += `Note ID: ${note.note_id} - Note: ${note.note}\n`
    })
  ctx.reply(result)
  }
})

bot.command('display', async ctx => {
// Check if user is registered
const user = await pool.query('SELECT * FROM users WHERE user_id = ?', [ctx.from.id])
if (user[0].length === 0) {
ctx.reply('You need to register first!')
return
}

// Display all notes
const notes = await pool.query('SELECT notes.*, users.username FROM notes LEFT JOIN users ON notes.user_id = users.user_id')
if (notes[0].length === 0) {
ctx.reply('No notes found.')
} else {
let result = ''
notes[0].forEach(note => {
result += `Note ID: ${note.note_id} - Note: ${note.note} - Added by: ${note.username}\n`
})
ctx.reply(result)
}
})

bot.launch()


