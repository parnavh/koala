import { PermissionGuard } from "@discordx/utilities";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ChannelType,
  MessageActionRowComponentBuilder,
  SelectMenuDefaultValueType,
  type CommandInteraction,
} from "discord.js";
import {
  Discord,
  Guard,
  SelectMenuComponent,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";

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

    await koala.db.voiceAnnounceEnable(interaction.guildId, mode);

    let content = "Announcement has been enabled!";

    if (mode !== "GLOBAL") {
      content +=
        "\nPlease ensure that you have configured the required channels too!";
    }

    void interaction.reply({
      content,
      ephemeral: true,
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

    await koala.db.voiceAnnounceDisable(interaction.guildId);

    let content = "Announcement has been disabled";

    void interaction.reply({
      content,
      ephemeral: true,
    });
  }

  @SelectMenuComponent({ id: "announcement-voice-channel" })
  async voiceChannels(interaction: ChannelSelectMenuInteraction) {
    await interaction.deferReply({
      ephemeral: true,
    });

    if (!interaction.guildId) {
      return;
    }

    const channels = interaction.values;

    koala.db.setVoiceAnnounceChannel(interaction.guildId, channels);

    const content =
      channels.length == 0
        ? "Removed all channels!"
        : `Configured ${channels.length} channel${
            channels.length == 1 ? "" : "s"
          }`;

    interaction.followUp({
      content,
      ephemeral: true,
    });
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

    const menu = new ChannelSelectMenuBuilder({
      customId: "announcement-voice-channel",
      channelTypes: [ChannelType.GuildVoice],
      minValues: 0,
      maxValues: interaction.guild.channels.cache.filter(
        (channel) => channel.type == ChannelType.GuildVoice,
      ).size,
      default_values: config.channels.map((channel) => ({
        id: channel.id.toString(),
        type: SelectMenuDefaultValueType.Channel,
      })),
    });

    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        menu,
      );

    interaction.reply({
      ephemeral: true,
      components: [row],
      content: `Pick the channels you want to ${
        config?.announceMode == "ENABLE" ? "enable" : "disable"
      }`,
    });
  }
}
