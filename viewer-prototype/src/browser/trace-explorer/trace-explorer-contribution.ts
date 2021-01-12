import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { TraceExplorerWidget, TRACE_EXPLORER_ID, TRACE_EXPLORER_LABEL } from './trace-explorer-widget';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { MenuModelRegistry, MenuPath, Command } from '@theia/core';

export namespace PreferenceMenus {
    export const PREFERENCE_EDITOR_CONTEXT_MENU: MenuPath = ['trace-explorer-context-menu'];
}
export namespace PreferencesCommands {
    export const RESET_PREFERENCE: Command = {
        id: 'preferences:reset',
        label: 'Reset Setting'
    };
}


export class TraceExplorerContribution extends AbstractViewContribution<TraceExplorerWidget> implements
    FrontendApplicationContribution {

    constructor() {
        super({
            widgetId: TRACE_EXPLORER_ID,
            widgetName: TRACE_EXPLORER_LABEL,
            defaultWidgetOptions: {
                area: 'left'
            },
            toggleCommandId: 'trace-explorer:toggle'
        });
    }

    async initializeLayout(_app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false });
    }


    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(PreferenceMenus.PREFERENCE_EDITOR_CONTEXT_MENU, {
            commandId: PreferencesCommands.RESET_PREFERENCE.id,
            label: PreferencesCommands.RESET_PREFERENCE.label,
            order: 'a'
        });
    }
}
