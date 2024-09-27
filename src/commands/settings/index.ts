import { Discord, SlashGroup } from "discordx";

@Discord()
@SlashGroup({ description: "Edit configurations", name: "settings" })
export class Settings {}
