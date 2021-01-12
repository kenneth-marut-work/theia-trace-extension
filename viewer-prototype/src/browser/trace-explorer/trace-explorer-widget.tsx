import { injectable, inject, postConstruct } from 'inversify';
import { TraceExplorerAnalysisWidget } from './trace-explorer-sub-widgets/trace-explorer-analysis-widget';
import { ViewContainer, BaseWidget, Message, PanelLayout } from '@theia/core/lib/browser';
import { TraceExplorerTooltipWidget } from './trace-explorer-sub-widgets/trace-explorer-tooltip-widget';
import { TraceExplorerOpenedTracesWidget } from './trace-explorer-sub-widgets/trace-explorer-opened-traces-widget';
import { TraceExplorerPlaceholderWidget } from './trace-explorer-sub-widgets/trace-explorer-placeholder-widget';

export const TRACE_EXPLORER_LABEL = 'Trace Explorer';
export const TRACE_EXPLORER_ID = 'trace-explorer';

@injectable()
export class TraceExplorerWidget extends BaseWidget {
    protected traceViewsContainer!: ViewContainer;
    @inject(TraceExplorerAnalysisWidget) protected readonly analysisWidget!: TraceExplorerAnalysisWidget;
    @inject(TraceExplorerOpenedTracesWidget) protected readonly openedTracesWidget!: TraceExplorerOpenedTracesWidget;
    @inject(TraceExplorerTooltipWidget) protected readonly tooltipWidget!: TraceExplorerTooltipWidget;
    @inject(TraceExplorerPlaceholderWidget) protected readonly placeholderWidget!: TraceExplorerPlaceholderWidget;
    @inject(ViewContainer.Factory) protected readonly viewContainerFactory!: ViewContainer.Factory;

    @postConstruct()
    init(): void {
        this.id = TRACE_EXPLORER_ID;
        this.title.label = TRACE_EXPLORER_LABEL;
        this.title.caption = TRACE_EXPLORER_LABEL;
        this.title.iconClass = 'trace-explorer-tab-icon';
        this.title.closable = true;
        this.toDispose.push(this.openedTracesWidget.widgetWasUpdated(() => this.update()));
        this.traceViewsContainer = this.viewContainerFactory({
            id: this.id
        });
        this.traceViewsContainer.addWidget(this.openedTracesWidget);
        this.traceViewsContainer.addWidget(this.analysisWidget);
        this.traceViewsContainer.addWidget(this.tooltipWidget);
        this.toDispose.push(this.traceViewsContainer);
        const layout = this.layout = new PanelLayout();
        layout.addWidget(this.placeholderWidget);
        layout.addWidget(this.traceViewsContainer);
        this.update();
    }

    protected onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        const { openedExperiments } = this.openedTracesWidget;
        if (openedExperiments.length) {
            this.traceViewsContainer.show();
            this.placeholderWidget.hide();
        } else {
            this.traceViewsContainer.hide();
            this.placeholderWidget.show();
        }
    }
}
