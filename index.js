const fs = require("node:fs");
const path = require("node:path");
const cron = require("node-cron");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const {
  kickLurkers,
  postHelpfulHintToNewHereChannel,
  updateFirst100Roles,
  updateNewHereRoles,
  updatePartyTimerRoles,
  updateRankedRoles,
} = require("./cron/membership");
const {
  conditionalWednesdayPost,
  createFunTimeFridayEvent,
  focusFunTimeFridayEvent,
  unfocusFunTimeFridayEvent,
} = require("./cron/funTimeFriday");
const {
  updatePathfinderRoles,
  createPathfinderHikesEvent,
} = require("./cron/pathfinders");
const {
  createTrailblazerTuesdayEvent,
  updateTrailblazerRoles,
} = require("./cron/trailblazers");

dotenv.config();

const { BOT_TOKEN } = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// Set up commands dynamically using the contents of the /commands folder
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Set up customInteractions dynamically using the contents of the /customInteractions folder
client.customInteractions = new Collection();
const customInteractionsPath = path.join(__dirname, "customInteractions");
const customInteractionFiles = fs
  .readdirSync(customInteractionsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of customInteractionFiles) {
  const filePath = path.join(customInteractionsPath, file);
  const customInteraction = require(filePath);
  client.customInteractions.set(customInteraction.name, customInteraction);
}

// Set up events dynamically using the contents of the /events folder
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(BOT_TOKEN);

const scheduleFunc = (cronExpression, func, ...args) => {
  cron.schedule(
    cronExpression,
    () => {
      try {
        func(...args);
      } catch (e) {
        console.error(e);
      }
    },
    {
      scheduled: true,
      timezone: "America/Denver",
    }
  );
};

// Schedule all future cronjobs when the client emits the "ready" event
client.on("ready", () => {
  // Membership
  scheduleFunc("0 0 8 * * 1", kickLurkers, client); // every Monday at 8AM
  scheduleFunc(
    "0 30 9,10,11,12,13,14,15,16,17,18 * * *",
    postHelpfulHintToNewHereChannel,
    client
  ); // at the 30 minute mark, ten times per day
  scheduleFunc("0 5 * * * *", updateFirst100Roles, client); // every hour on the fifth minute
  scheduleFunc("0 0 * * * *", updateNewHereRoles, client); // every hour
  scheduleFunc("0 0 * * * *", updateRankedRoles, client); // every hour
  scheduleFunc("0 0 11 * * 2", updatePartyTimerRoles, client); // every Tuesday at 11AM

  // Fun Time Friday
  scheduleFunc("0 0 10 * * 2", createFunTimeFridayEvent, client); // every Tuesday at 10AM
  scheduleFunc("0 0 6 * * 3", conditionalWednesdayPost, client); // every Wednesday at 6AM
  scheduleFunc("0 0 12 * * 5", focusFunTimeFridayEvent, client); // every Friday at noon
  scheduleFunc("0 0 5 * * 6", unfocusFunTimeFridayEvent, client); // every Saturday at 5AM

  // Pathfinders
  scheduleFunc("0 15 9 * * 2", updatePathfinderRoles, client); // every Tuesday at 9:15AM
  scheduleFunc("0 0 10 * * 4", createPathfinderHikesEvent, client); // every Thursday at 10AM

  // Trailblazers
  scheduleFunc("0 5 9 * * 2", updateTrailblazerRoles, client); // every Tuesday at 9:05AM
  scheduleFunc("0 0 10 * * 3", createTrailblazerTuesdayEvent, client); // every Wednesday at 10AM
});
