import { ContainerModule, Container } from 'inversify';


import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham-dark.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
// import 'semantic-ui-css/semantic.min.css';
import { TraceExplorerContribution } from '../trace-explorer/trace-explorer-contribution';
import { TRACE_EXPLORER_ID, TraceExplorerWidget } from '../trace-explorer/trace-explorer-widget';
import { TspClientProvider } from '../tsp-client-provider';
import { TheiaMessageManager } from '../theia-message-manager';
import { TraceServerConnectionStatusService, TraceServerConnectionStatusContribution } from '../../browser/trace-server-status';
import { TraceServerUrlProviderImpl } from '../trace-server-url-provider-frontend-impl';
import { TraceViewerEnvironment } from '../../common/trace-viewer-environment';
import { FrontendApplicationContribution, WidgetFactory, OpenHandler } from '@theia/core/lib/browser';
import { TraceServerUrlProvider } from '../../common/trace-server-url-provider';
import { TraceViewerWidget, TraceViewerWidgetOptions } from './trace-viewer';
import { TraceViewerContribution } from './trace-viewer-contribution';
import { CommandContribution, MenuContribution } from '@theia/core';
// import { TracePropertiesContribution } from '../trace-properties-view/trace-properties-view-contribution';
// import { TracePropertiesWidget, TRACE_PROPERTIES_ID } from '../trace-properties-view/trace-properties-view-widget';

export default new ContainerModule(bind => {
    bind(TraceViewerEnvironment).toSelf().inRequestScope();
    bind(TraceServerUrlProviderImpl).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TraceServerUrlProviderImpl);
    bind(TraceServerUrlProvider).toService(TraceServerUrlProviderImpl);
    bind(TspClientProvider).toSelf().inSingletonScope();
    bind(TheiaMessageManager).toSelf().inSingletonScope();

    bind(TraceViewerWidget).toSelf();
    bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
        id: TraceViewerWidget.ID,
        async createWidget(options: TraceViewerWidgetOptions): Promise<TraceViewerWidget> {
            const child = new Container({ defaultScope: 'Singleton' });
            child.parent = context.container;
            child.bind(TraceViewerWidgetOptions).toConstantValue(options);
            return child.get(TraceViewerWidget);
        }
    })).inSingletonScope();

    bind(TraceViewerContribution).toSelf().inSingletonScope();
    // [CommandContribution, OpenHandler, FrontendApplicationContribution].forEach(serviceIdentifier =>
    //     bind(serviceIdentifier).toService(TraceViewerContribution)
    // );
    bind(CommandContribution).to(TraceViewerContribution);
    bind(OpenHandler).to(TraceViewerContribution);
    bind(FrontendApplicationContribution).to(TraceViewerContribution);

    // bindViewContribution(bind, TraceExplorerContribution);
    bind(TraceExplorerContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(TraceExplorerContribution);
    bind(MenuContribution).toService(TraceExplorerContribution);
    bind(FrontendApplicationContribution).toService(TraceExplorerContribution);
    bind(TraceExplorerWidget).toSelf().inSingletonScope();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: TRACE_EXPLORER_ID,
        createWidget: () => context.container.get<TraceExplorerWidget>(TraceExplorerWidget)
    })).inSingletonScope();

    bind(TraceServerConnectionStatusService).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TraceServerConnectionStatusService);
    bind(TraceServerConnectionStatusContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TraceServerConnectionStatusContribution);

    // bindViewContribution(bind, TracePropertiesContribution);
    // bind(TracePropertiesWidget).toSelf();
    // bind(WidgetFactory).toDynamicValue(context => ({
    //     id: TRACE_PROPERTIES_ID,
    //     createWidget: () => context.container.get<TracePropertiesWidget>(TracePropertiesWidget)
    // }));
});
