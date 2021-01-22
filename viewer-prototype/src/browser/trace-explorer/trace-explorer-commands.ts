import { Command, MenuPath } from '@theia/core';

export namespace TraceExplorerMenus {
    export const PREFERENCE_EDITOR_CONTEXT_MENU: MenuPath = ['trace-explorer-opened-traces-context-menu'];
}
export namespace TraceExplorerCommands {
    export const RESET_PREFERENCE: Command = {
        id: 'trace-explorer:preferences.reset',
        label: 'Reset Trace Explorer Setting'
    };
}
