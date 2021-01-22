import { injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { TraceExplorerWidget, } from './trace-explorer-widget';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { MenuModelRegistry, CommandRegistry } from '@theia/core';

import {PreferenceMenus, PreferencesCommands} from './trace-explorer-sub-widgets/trace-explorer-opened-traces-widget';


@injectable()
export class TraceExplorerContribution extends AbstractViewContribution<TraceExplorerWidget> implements FrontendApplicationContribution {
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

    initializeLayout(_app: FrontendApplication): void {
        this.openView({ activate: false });
    }

    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
        menus.registerMenuAction(PreferenceMenus.PREFERENCE_EDITOR_CONTEXT_MENU, {
            commandId: PreferencesCommands.RESET_PREFERENCE.id,
            label: PreferencesCommands.RESET_PREFERENCE.label,
            order: 'a'
        });
    }

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        registry.registerCommand(PreferencesCommands.RESET_PREFERENCE, {
            execute: () => {
                console.log("Context Menu Command");
            }
        });
    }

}
