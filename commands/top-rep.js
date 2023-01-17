const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

const TOP_REP_COUNT = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("top-rep")
    .setDescription(
      `View the top ${TOP_REP_COUNT} members by party hosting rep`
    ),
  async execute(interaction) {
    const { HALOFUNTIME_API_KEY, HALOFUNTIME_API_URL } = process.env;
    const response = await axios
      .get(`${HALOFUNTIME_API_URL}/reputation/top-rep?count=${TOP_REP_COUNT}`, {
        headers: {
          Authorization: `Bearer ${HALOFUNTIME_API_KEY}`,
        },
      })
      .then((response) => response.data)
      .catch(async (error) => {
        // Return the error payload directly if present
        if (error.response.data) {
          return error.response.data;
        }
        console.error(error);
      });
    if ("error" in response) {
      await interaction.reply({
        content: "I couldn't retrieve the rep leaderboard.",
        ephemeral: true,
      });
      return;
    }
    const receiversByRank = {};
    for (receiver of response.topRepReceivers) {
      if (!receiversByRank[receiver.rank]) {
        receiversByRank[receiver.rank] = [receiver];
      } else {
        receiversByRank[receiver.rank].push(receiver);
      }
    }
    const fields = [];
    for (let i = 1; i <= TOP_REP_COUNT; i++) {
      if (i in receiversByRank) {
        const receivers = receiversByRank[i];
        const valueStrings = [];
        for (receiver of receivers) {
          valueStrings.push(
            `<@${receiver.discordId}>: ${receiver.pastYearTotalRep} (${receiver.pastYearUniqueRep} unique)`
          );
        }
        fields.push({
          name: `#${i}`,
          value: valueStrings.join("\n"),
        });
      }
    }
    const topEmbed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle("Party Hosting Rep Leaderboard")
      .setThumbnail("https://api.halofuntime.com/static/HFTLogo.png")
      .addFields(fields)
      .setTimestamp()
      .setFooter({
        text: "Generated by HaloFunTime",
        iconURL: "https://api.halofuntime.com/static/HFTLogo.png",
      });
    await interaction.reply({
      allowedMentions: { parse: [] },
      embeds: [topEmbed],
    });
  },
};