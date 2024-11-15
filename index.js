const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");
const moment = require("moment-timezone"); // Aggiungi questa libreria per il fuso orario
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});
const http = require("http"); // Importa il modulo http di Node.js

const token = process.env["DISCORD_TOKEN"]; // Inserisci qui il token del bot

// Evento al login del bot
client.once("ready", () => {
  console.log("Bot is online!");
});

// Evento per dare il benvenuto a un nuovo membro
client.on("guildMemberAdd", (member) => {
  const channel = member.guild.channels.cache.find(
    (ch) => ch.name === "welcome",
  );
  if (!channel) return;
  channel.send(`Welcome, ${member}! 🎉`);
});

let remindersByChannel = {};

// Carica i reminder dal file JSON
fs.readFile("./reminders.json", "utf8", (err, data) => {
  if (err) {
    console.error("Errore nel caricamento dei reminder:", err);
    return;
  }
  remindersByChannel = JSON.parse(data);
  console.log("Reminder caricati con successo:", remindersByChannel);
});

// Aggiungi il server HTTP per il ping
const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/ping") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Pong"); // Risposta per UptimeRobot
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

// Avvia il server HTTP su una porta (ad esempio, 3000)
server.listen(3000, () => {
  console.log("Server in ascolto sulla porta 3000");
});

// Gestisce il bot e i reminder
client.on("ready", () => {
  console.log(
    "Bot è pronto per inviare reminder per i giorni e weekend specifici!",
  );

  setInterval(() => {
    // Ottieni l'ora attuale nel fuso orario di Roma
    const currentTime = moment.tz("Europe/Rome");
    const currentHour = currentTime.hour();
    const currentMinute = currentTime.minute();
    const currentDay = currentTime.day();

    // 0 = domenica, 6 = sabato
    const isWeekend = currentDay === 6 || currentDay === 0;

    // Cicla su ciascun canale nei reminder
    for (const channelName in remindersByChannel) {
      const channel = client.channels.cache.find(
        (ch) => ch.name === channelName,
      );
      if (channel) {
        remindersByChannel[channelName].forEach((reminder) => {
          const shouldSend = reminder.weekendOnly ? isWeekend : true;
          if (
            shouldSend &&
            currentHour === reminder.hour &&
            currentMinute === reminder.minute
          ) {
            channel.send(reminder.message);
            console.log(`Reminder inviato nel canale ${channelName}`);
          }
        });
      } else {
        console.log(`Canale ${channelName} non trovato.`);
      }
    }
  }, 60000); // Controllo ogni minuto
});

client.login(token);
