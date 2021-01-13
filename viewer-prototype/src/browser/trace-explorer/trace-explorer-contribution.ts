import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { TraceExplorerWidget, TRACE_EXPLORER_ID, TRACE_EXPLORER_LABEL } from './trace-explorer-widget';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { MenuModelRegistry, CommandRegistry, MenuContribution } from '@theia/core';
import { PreferencesCommands, PreferenceMenus } from './trace-explorer-constants';





export class TraceExplorerContribution extends AbstractViewContribution<TraceExplorerWidget> implements
    FrontendApplicationContribution,
    MenuContribution {

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

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(PreferencesCommands.RESET_PREFERENCE, {
            isEnabled: () => true,
            isVisible: () => true,
            execute: () => {
                console.log('HELLO');
            }
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(PreferenceMenus.PREFERENCE_EDITOR_CONTEXT_MENU, {
            commandId: PreferencesCommands.RESET_PREFERENCE.id,
            label: PreferencesCommands.RESET_PREFERENCE.label,
            order: '0'
        });
    }
}
