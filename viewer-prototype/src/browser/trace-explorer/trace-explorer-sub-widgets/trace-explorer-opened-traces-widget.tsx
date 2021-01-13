import { injectable, postConstruct } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser";
import * as React from 'react';
import { List } from 'react-virtualized';


@injectable()
export class TraceExplorerOpenedTracesWidget extends ReactWidget {
    static ID = 'trace-explorer-opened-traces-widget';
    static LABEL = 'Opened Traces';

    @postConstruct()
    init(): void {
        this.id = TraceExplorerOpenedTracesWidget.ID;
        this.title.label = TraceExplorerOpenedTracesWidget.LABEL;
        this.update();
    }

    render(): React.ReactNode {
        return (
            <div className='trace-explorer-opened'>
                <div className='trace-explorer-panel-title' onClick={this.updateOpenedExperiments}>
                    {TraceExplorerOpenedTracesWidget.LABEL}
                </div>
                <div className='trace-explorer-panel-content'>
                    <List
                        height={300}
                        width={300}
                        rowCount={this.openedExperiments.length}
                        rowHeight={50}
                        rowRenderer={this.experimentRowRenderer} />
                </div>
            </div>
        );
    }
}