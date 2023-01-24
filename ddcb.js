//import Telegraf from 'telegraf'
const { Telegraf } = require('telegraf')
const mysql = require('mysql2/promise')
const fs = require('fs')
require('dotenv').config()

const bot = new Telegraf('BOT-TOKEN')

const connection = mysql.createConnection({
      host: 'localhost',
      user: 'USERNAME',
      password: 'PASSWORD',
      database: 'ddcb',
      multipleStatements: true
})

bot.start((ctx) => {
  ctx.reply('Welcome to the Note-taking Telegram bot!')
})

bot.command('add', ctx => {
  ctx.reply('Please enter the note you would like to add:')
});
bot.on('message', (ctx) => {
  if(ctx.message.text.startsWith("!add")) {
    noteText = ctx.message.text.slice(5);
    let userId = ctx.from.id;
    let log = {user: userId,command: "add"}
    fs.appendFile('telegram-command-log.json', JSON.stringify(log), (err) => { if (err) throw err;});
    let sql = 'INSERT INTO notes (user_id, note) VALUES (?,?)';
    let values = [userId, noteText];
    connection.query(sql, values, function (err, result) {
      if (err) {
        ctx.reply('An error occurred while adding the note to the database: ' + err.message)
      } else {
        ctx.reply('Note added successfully!')
      }
    });
    connection.end();
  }
});




bot.command('update', (ctx) => {
  ctx.reply('Please enter the note ID you would like to update:')
  ctx.on('message', async (msg) => {
    let noteId = msg.text
    let userId = ctx.from.id
    let log = {
        user: userId,
        command: "update"
    }
    fs.appendFile('telegram-command-log.json', JSON.stringify(log), (err) => {
        if (err) throw err;
    });
    let sql = 'SELECT * FROM notes WHERE note_id = ? and user_id = ?'
    let [rows] = await connection.execute(sql, [noteId, userId])
    if(rows.length>0) {
        ctx.reply('Please enter the new note:')
        ctx.on('message', async (msg) => {
            let newNote = msg.text
            sql = 'UPDATE notes SET note = ? WHERE note_id = ?'
            await connection.execute(sql, [newNote, noteId])
            ctx.reply('Note updated successfully!')
        })
    } else {
        ctx.reply('Note does not exist or you are not the owner of the note')
    }
    connection.end()
  })
})








bot.command('remove', (ctx) => {
  ctx.reply('Please enter the note ID you would like to remove:')
  ctx.on('message', async (msg) => {
    let noteId = msg.text
    let userId = ctx.from.id
    let log = {
        user: userId,
        command: "remove"
    }
    fs.appendFile('telegram-command-log.json', JSON.stringify(log), (err) => {
        if (err) throw err;
    });
    let sql = 'SELECT * FROM notes WHERE note_id = ? and user_id = ?'
    let [rows] = await connection.execute(sql, [noteId, userId])
    if(rows.length>0) {
        sql = 'DELETE FROM notes WHERE note_id = ?'
        await connection.execute(sql, [noteId])
        ctx.reply('Note removed successfully!')
    } else {
        ctx.reply('Note does not exist or you are not the owner of the note')
    }
    connection.end()
  })
})



bot.command('display', (ctx) => {
  ctx.reply('Please enter the topic you would like to display notes for:')
  ctx.on('message', (msg) => {
    let userId = ctx.from.id
    let log = {
        user: userId,
        command: "display"
    }
    fs.appendFile('telegram-command-log.json', JSON.stringify(log), (err) => {
        if (err) throw err;
    });
    let topic = msg.text
    let sql = 'SELECT * FROM notes WHERE topic = ?'
    let values = [topic]
    connection.query(sql, values, function (err, rows, fields) {
      if (err) {
        ctx.reply('An error occurred while displaying the notes from the database: ' + err.message)
      } else {
        let notes = rows.map(note => note.note).join('\n\n')
        ctx.reply(`Notes for topic "${topic}":\n\n${notes}`)
      }
    })
    connection.end()
  })
})


bot.command('search', (ctx) => {
  ctx.reply('Please enter the keywords you would like to search for:')
  ctx.on('message', (msg) => {
    let userId = ctx.from.id
    let log = {
        user: userId,
        command: "search"
    }
    fs.appendFile('telegram-command-log.json', JSON.stringify(log), (err) => {
        if (err) throw err;
    });
    let keywords = msg.text
    let sql = 'SELECT * FROM notes WHERE note LIKE ?'
    let values = ['%'+keywords+'%']
    connection.query(sql, values, function (err, rows, fields) {
      if (err) {
        ctx.reply('An error occurred while searching the notes: ' + err.message)
      } else {
        let notes = rows.map(note => note.note).join('\n\n')
        if(notes.length>0)
          ctx.reply(`Notes for keyword "${keywords}":\n\n${notes}`)
        else
          ctx.reply(`No notes found for keyword "${keywords}"`)
      }
    })
    connection.end()
  })
})



bot.launch()

