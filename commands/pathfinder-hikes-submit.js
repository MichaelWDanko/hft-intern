const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const {
  HALOFUNTIME_ID_ROLE_PATHFINDER,
  HALOFUNTIME_ID_CHANNEL_CLUBS,
  HALOFUNTIME_ID_CHANNEL_WAYWO,
} = require("../constants.js");
const { getDateTimeForPathfinderEventStart } = require("../utils/pathfinders");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pathfinder-hikes-submit")
    .setDescription(
      "Submit a map to the Pathfinder Hikes weekly playtest session"
    )
    .addStringOption((option) =>
      option
        .setName("map")
        .setDescription("The name of the map you want to submit")
        .setMaxLength(32)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("mode1")
        .setDescription("The name of the first mode to test the map with")
        .setMaxLength(32)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("mode2")
        .setDescription("The name of the second mode to test the map with")
        .setMaxLength(32)
        .setRequired(true)
    ),
  async execute(interaction) {
    // Command may only be executed by someone with the Pathfinder role
    if (!interaction.member.roles.cache.has(HALOFUNTIME_ID_ROLE_PATHFINDER)) {
      await interaction.reply({
        content: `You must have the <@&${HALOFUNTIME_ID_ROLE_PATHFINDER}> role to use this command. You can get it in the <#${HALOFUNTIME_ID_CHANNEL_CLUBS}> channel.`,
        ephemeral: true,
      });
      return;
    }
    // Command may only be executed on a post in the WAYWO channel
    let inWaywoChannel = false;
    if (
      interaction.channel.isThread &&
      interaction.channel.parentId === HALOFUNTIME_ID_CHANNEL_WAYWO
    ) {
      inWaywoChannel = true;
    }
    if (!inWaywoChannel) {
      await interaction.reply({
        content: `You may only use this command on a post in the <#${HALOFUNTIME_ID_CHANNEL_WAYWO}> channel.`,
        ephemeral: true,
      });
      return;
    }
    const now = dayjs();
    const thisWeekWednesday = now.day(3);
    const nextWeekWednesday = thisWeekWednesday.add(1, "week");
    const thisWeekEventStart =
      getDateTimeForPathfinderEventStart(thisWeekWednesday);
    // If this command is issued AFTER the start time of this week's event, schedule the submission for next week
    const scheduledPlaytestDate =
      now > thisWeekEventStart ? nextWeekWednesday : thisWeekWednesday;
    const scheduledPlaytestDateTime = getDateTimeForPathfinderEventStart(
      scheduledPlaytestDate
    );
    const map = interaction.options.getString("map");
    const mode1 = interaction.options.getString("mode1");
    const mode2 = interaction.options.getString("mode2");
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .post(
        `${HALOFUNTIME_API_URL}/pathfinder/hike-submission`,
        {
          waywoPostTitle: interaction.channel.name,
          waywoPostId: interaction.channelId,
          mapSubmitterDiscordId: interaction.user.id,
          mapSubmitterDiscordTag: interaction.user.tag,
          scheduledPlaytestDate: scheduledPlaytestDate.format("YYYY-MM-DD"),
          map: map,
          mode1: mode1,
          mode2: mode2,
        },
        {
          headers: {
            Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
          },
        }
      )
      .then((response) => response.data)
      .catch(async (error) => {
        console.error(error);
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
      });
    if (response.success) {
      await interaction.reply({
        content: `<@${
          interaction.user.id
        }> successfully submitted **${map}** for **Pathfinder Hikes** playtesting on <t:${scheduledPlaytestDateTime.unix()}:D> at <t:${scheduledPlaytestDateTime.unix()}:t>!`,
      });
    } else if ("error" in response) {
      // Try to figure out a "friendly" rejection message
      let friendlyMessage = "";
      if (response?.error?.status_code === 403) {
        if (
          response?.error?.details?.detail ===
          "A Pathfinder Hike submission already exists for this post."
        ) {
          friendlyMessage = `\n\nThe map referenced by this post has already been submitted for playtesting on <t:${scheduledPlaytestDateTime.unix()}:D> at <t:${scheduledPlaytestDateTime.unix()}:t>.`;
        }
        if (
          response?.error?.details?.detail ===
          "A Pathfinder Hike submission has already been created by this Discord user."
        ) {
          friendlyMessage = `\n\nYou have already submitted another map for playtesting on <t:${scheduledPlaytestDateTime.unix()}:D> at <t:${scheduledPlaytestDateTime.unix()}:t>. Users may submit a maximum of one map per week.`;
        }
      }
      await interaction.reply({
        content: `Your submission was rejected.${friendlyMessage}`,
        ephemeral: true,
      });
    }
  },
};
