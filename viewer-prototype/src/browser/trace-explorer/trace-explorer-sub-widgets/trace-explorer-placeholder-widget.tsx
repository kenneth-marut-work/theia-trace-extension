import { inject, injectable, postConstruct } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser";
import * as React from 'react';
import { TraceViewerContribution } from '../../trace-viewer/trace-viewer-contribution';

@injectable()
export class TraceExplorerPlaceholderWidget extends ReactWidget {
    static ID = 'trace-explorer-placeholder-widget';
    static LABEL = 'Trace Exploerer Placeholder Widget';

    @inject(TraceViewerContribution) protected readonly traceViewerContribution!: TraceViewerContribution;

    @postConstruct()
    init(): void {
        this.id = TraceExplorerPlaceholderWidget.ID;
        this.title.label = TraceExplorerPlaceholderWidget.LABEL;
        this.update();
    }

    render(): React.ReactNode {
        this.handleOpenTrace = this.handleOpenTrace.bind(this);

        return <div className='theia-navigator-container' tabIndex={0}>
            <div className='center'>{'You have not yet opened a trace.'}</div>
            <div className='open-workspace-button-container'>
                <button className='theia-button open-workspace-button' title='Select a trace to open'
                    onClick={this.handleOpenTrace}>{'Open Trace'}</button>
            </div>
        </div>;
    }

    private async handleOpenTrace() {
        this.traceViewerContribution.openDialog();
    }
}