import { injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { TraceExplorerWidget, } from './trace-explorer-widget';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { MenuModelRegistry, CommandRegistry, CommandContribution } from '@theia/core';
import { TraceExplorerCommands, TraceExplorerMenus } from './trace-explorer-commands';

@injectable()
export class TraceExplorerContribution extends AbstractViewContribution<TraceExplorerWidget>
    implements FrontendApplicationContribution, CommandContribution {
    constructor() {
        super({
            widgetId: TraceExplorerWidget.ID,
            widgetName: TraceExplorerWidget.LABEL,
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
        super.registerMenus(menus);
        menus.registerMenuAction(TraceExplorerMenus.PREFERENCE_EDITOR_CONTEXT_MENU, {
            commandId: TraceExplorerCommands.RESET_PREFERENCE.id,
            label: TraceExplorerCommands.RESET_PREFERENCE.label,
            order: 'a'
        });
    }

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        registry.registerCommand(TraceExplorerCommands.RESET_PREFERENCE, {
            execute: () => {
                console.log('Context Menu Command');
            }
        });
    }

}
