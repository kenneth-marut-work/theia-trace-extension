import { AbstractViewContribution } from '@theia/core/lib/browser';
import { TraceContextMenuWidget } from './trace-context-menu';
import { MenuModelRegistry, Command, MenuPath } from '@theia/core';

export namespace PreferenceMenus {
    export const PREFERENCE_EDITOR_CONTEXT_MENU: MenuPath = ['trace-explorer-context-menu'];
}
export namespace PreferencesCommands {
    export const RESET_PREFERENCE: Command = {
        id: 'preferences:reset',
        label: 'Reset Setting'
    };
}

export class TraceContextMenuContribution extends AbstractViewContribution<TraceContextMenuWidget> {

    constructor() {
        super({
            widgetId: TraceContextMenuWidget.ID,
            widgetName: TraceContextMenuWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
            },
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(PreferenceMenus.PREFERENCE_EDITOR_CONTEXT_MENU, {
            commandId: PreferencesCommands.RESET_PREFERENCE.id,
            label: PreferencesCommands.RESET_PREFERENCE.label,
            order: 'a'
        });
    }

}