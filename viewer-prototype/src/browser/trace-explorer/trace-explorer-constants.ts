import { MenuPath, Command } from "@theia/core";

export namespace PreferenceMenus {
    export const PREFERENCE_EDITOR_CONTEXT_MENU: MenuPath = ['trace.explorer.context.menu'];
}
export namespace PreferencesCommands {
    export const RESET_PREFERENCE: Command = {
        id: 'preferences:reset',
        label: 'Reset Setting'
    };
}