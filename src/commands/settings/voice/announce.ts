import { ANNOUNCEMENT_VOICE_CHANNELS_PAGE_SIZE } from "@/constants";
import { ERROR_MESSAGES, MaintenanceError } from "@/errors";
import { PermissionGuard } from "@discordx/utilities";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuInteraction,
  ChannelType,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  VoiceChannel,
  type CommandInteraction,
} from "discord.js";
import {
  Discord,
  Guard,
  ButtonComponent,
  SelectMenuComponent,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";

type VoiceConfig = NonNullable<
  Awaited<ReturnType<typeof koala.db.getVoiceConfig>>
>;

@Discord()
@SlashGroup({
  name: "announce",
  root: "settings",
  description: "Manage voice announcement settings",
})
@SlashGroup("announce", "settings")
export class VoiceSettings {
  @Slash({ description: "Enable announcement in voice channels" })
  @Guard(
    PermissionGuard(["ManageGuild"], {
      content: "You cannot use this command!",
      ephemeral: true,
    }),
  )
  async enable(
    @SlashChoice({ name: "In all channels", value: "GLOBAL" })
    @SlashChoice({ name: "In a few select channels", value: "ENABLE" })
    @SlashChoice({ name: "In all channels except a few", value: "DISABLE" })
    @SlashOption({
      name: "channels",
      description: "Select channels to enable",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    mode: "GLOBAL" | "ENABLE" | "DISABLE",
    interaction: CommandInteraction,
  ) {
    if (!interaction.guild || !interaction.guildId) {
      return void interaction.reply({
        ephemeral: true,
        content: "This command can only be run in a server",
      });
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    let content = "Announcement has been enabled!";

    if (mode !== "GLOBAL") {
      content +=
        "\nPlease ensure that you have configured the required channels too!";
    }

    try {
      await koala.db.voiceAnnounceEnable(interaction.guildId, mode);
    } catch (e) {
      if (e instanceof MaintenanceError) content = e.message;
      else content = "Something went wrong, please try again later!";
    }

    void interaction.editReply({
      content,
    });
  }

  @Slash({ description: "Disable announcement in voice channels" })
  @Guard(
    PermissionGuard(["ManageGuild"], {
      content: "You cannot use this command!",
      ephemeral: true,
    }),
  )
  async disable(interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      return void interaction.reply({
        ephemeral: true,
        content: "This command can only be run in a server",
      });
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    let content = "Announcement has been disabled";

    try {
      await koala.db.voiceAnnounceDisable(interaction.guildId);
    } catch (e) {
      if (e instanceof MaintenanceError) content = e.message;
      else content = "Something went wrong, please try again later!";
    }

    void interaction.editReply({
      content,
    });
  }

  @SelectMenuComponent({ id: /^announcement-voice-channel:\d+$/ })
  async voiceChannels(interaction: ChannelSelectMenuInteraction) {
    await interaction.deferReply({
      ephemeral: true,
    });

    if (!interaction.guild) {
      return;
    }

    const page = parseInt(interaction.customId.split(":")[1]);

    const allVoiceChannels = Array.from(
      interaction.guild.channels.cache
        .filter((c) => c.type == ChannelType.GuildVoice)
        .values(),
    );

    const start = page * ANNOUNCEMENT_VOICE_CHANNELS_PAGE_SIZE;
    const pageChannelIds = new Set(
      allVoiceChannels
        .slice(start, start + ANNOUNCEMENT_VOICE_CHANNELS_PAGE_SIZE)
        .map((c) => c.id),
    );

    const config = await koala.db.getVoiceConfig(interaction.guild.id);

    if (!config) {
      return console.warn(
        `Voice channel change initiated for a guild with no voice config, guilId: ${interaction.guild.id}`,
      );
    }

    const existingIds = config.channels.map((c) => c.id.toString()) ?? [];

    const merged = [
      ...existingIds.filter((id) => !pageChannelIds.has(id)),
      ...interaction.values,
    ];

    let content =
      merged.length == 0
        ? "Removed all channels!"
        : `Configured ${merged.length} channel${merged.length == 1 ? "" : "s"}`;

    try {
      await koala.db.setVoiceAnnounceChannel(interaction.guild.id, merged);
    } catch (e) {
      if (e instanceof MaintenanceError) content = e.message;
      else content = "Something went wrong, please try again later!";
    }

    interaction.editReply({
      content,
    });
  }

  @ButtonComponent({ id: /^announcement-voice-channel-page:\d+$/ })
  async voiceChannelPageChange(interaction: ButtonInteraction) {
    if (!interaction.guild) return;

    const page = parseInt(interaction.customId.split(":")[1]);
    const config = await koala.db.getVoiceConfig(interaction.guild.id);

    if (!config) {
      return console.warn(
        `Voice channel change initiated for a guild with no voice config, guilId: ${interaction.guild.id}`,
      );
    }

    const voiceChannels = Array.from(
      interaction.guild.channels.cache
        .filter((channel) => channel.type == ChannelType.GuildVoice)
        .values(),
    );

    await interaction.update(this.buildMenu(config, voiceChannels, page));
  }

  buildMenu(config: VoiceConfig, voiceChannels: VoiceChannel[], page: number) {
    const start = page * ANNOUNCEMENT_VOICE_CHANNELS_PAGE_SIZE;
    const pageChannels = voiceChannels.slice(
      start,
      start + ANNOUNCEMENT_VOICE_CHANNELS_PAGE_SIZE,
    );
    const totalPages = Math.ceil(
      voiceChannels.length / ANNOUNCEMENT_VOICE_CHANNELS_PAGE_SIZE,
    );

    const configuredIds = new Set(config.channels.map((c) => c.id.toString()));

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`announcement-voice-channel:${page}`)
      .setMinValues(0)
      .setMaxValues(pageChannels.length)
      .setOptions(
        pageChannels.map((channel) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(channel.name)
            .setValue(channel.id)
            .setDefault(configuredIds.has(channel.id)),
        ),
      );

    const menuRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        menu,
      );

    const prevButton = new ButtonBuilder()
      .setCustomId(`announcement-voice-channel-page:${page - 1}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0);

    const nextButton = new ButtonBuilder()
      .setCustomId(`announcement-voice-channel-page:${page + 1}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages - 1);

    const pageIndicator = new ButtonBuilder()
      .setCustomId("announcement-voice-channel-page-indicator")
      .setLabel(`Page ${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const buttonRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        prevButton,
        pageIndicator,
        nextButton,
      );

    return {
      ephemeral: true,
      components: totalPages > 1 ? [menuRow, buttonRow] : [menuRow],
      content: `Pick the channels you want to ${
        config?.announceMode == "ENABLE" ? "enable" : "disable"
      }`,
    };
  }

  @Slash({ description: "Enable announcement in voice channels" })
  @Guard(
    PermissionGuard(["ManageGuild"], {
      content: "You cannot use this command!",
      ephemeral: true,
    }),
  )
  async channels(interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      return interaction.reply({
        ephemeral: true,
        content: "This command can only be run in a server",
      });
    }

    const config = await koala.db.getVoiceConfig(interaction.guildId);

    if (!config || !config.enabled || !config.announce) {
      return interaction.reply({
        ephemeral: true,
        content: "Voice announcement is not enabled :(",
      });
    }

    if (config.announceMode == "GLOBAL") {
      return interaction.reply({
        ephemeral: true,
        content:
          "Every channel is enabled for announcement, you do not need to configure this!",
      });
    }

    if (await koala.db.getMaintenanceMode()) {
      return interaction.reply({
        ephemeral: true,
        content: ERROR_MESSAGES["maintenance"],
      });
    }

    const voiceChannels = Array.from(
      interaction.guild.channels.cache
        .filter((channel) => channel.type == ChannelType.GuildVoice)
        .values(),
    );

    interaction.reply(this.buildMenu(config, voiceChannels, 0));
  }
}
