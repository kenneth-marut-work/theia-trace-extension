import { injectable, postConstruct } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser";
import * as React from 'react';
import { List } from 'react-virtualized';

@injectable()
export class TraceExplorerAnalysisWidget extends ReactWidget {
    static ID = 'trace-explorer-analysis-widget';
    static LABEL = 'Available Analysis';

    @postConstruct()
    init(): void {
        this.id = TraceExplorerAnalysisWidget.ID;
        this.title.label = TraceExplorerAnalysisWidget.LABEL;
        this.update();
    }

    render(): React.ReactNode {
        return (
            <div className='trace-explorer-analysis'>
                <div className='trace-explorer-panel-title'>
                    {TraceExplorerAnalysisWidget.LABEL}
                </div>
                <div className='trace-explorer-panel-content'>
                    <List
                        height={300}
                        width={300}
                        rowCount={outputsRowCount}
                        rowHeight={50}
                        rowRenderer={this.outputsRowRenderer} />
                </div>
            </div>
        );
    }

    private outputsRowRenderer(props: ListRowProps): React.ReactNode {
        let outputName = '';
        let outputDescription = '';
        const selectedTrace = this.openedExperiments[this.selectedExperimentIndex];
        if (selectedTrace) {
            const outputDescriptors = this.availableOutputDescriptors.get(selectedTrace.UUID);
            if (outputDescriptors && outputDescriptors.length && props.index < outputDescriptors.length) {
                outputName = outputDescriptors[props.index].name;
                outputDescription = outputDescriptors[props.index].description;
            }
        }
        let traceContainerClassName = 'outputs-list-container';
        if (props.index === this.lastSelectedOutputIndex) {
            traceContainerClassName = traceContainerClassName + ' theia-mod-selected';
        }
        return <div className={traceContainerClassName} key={props.key} style={props.style} onClick={this.outputClicked.bind(this, props.index)}>
            <div className='outputs-element-name'>
                {outputName}
            </div>
            <div className='outputs-element-description'>
                {outputDescription}
            </div>
        </div>;
    }
}