import { inject, injectable, postConstruct } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser";
import * as React from 'react';
import { List, ListRowProps } from 'react-virtualized';
import { TraceExplorerOpenedTracesWidget } from './trace-explorer-opened-traces-widget';

@injectable()
export class TraceExplorerAnalysisWidget extends ReactWidget {
    static ID = 'trace-explorer-analysis-widget';
    static LABEL = 'Available Analysis';

    @inject(TraceExplorerOpenedTracesWidget) protected readonly openedTracesWidget!: TraceExplorerOpenedTracesWidget;

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

    private outputsRowRenderer = (props: ListRowProps): React.ReactNode => {
        let outputName = '';
        let outputDescription = '';
        const { openedExperiments, availableOutputDescriptors, selectedExperimentIndex } = this.openedTracesWidget;
        const selectedTrace = this.openedTracesWidget.openedExperiments[this.openedTracesWidget.selectedExperimentIndex];
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

    private outputClicked(index: number) {
        this.lastSelectedOutputIndex = index;
        const trace = this.openedExperiments[this.selectedExperimentIndex];
        const outputs = this.availableOutputDescriptors.get(trace.UUID);
        if (outputs) {
            TraceExplorerWidget.outputAddedEmitter.fire(new OutputAddedSignalPayload(outputs[index], trace));
        }
        this.update();
    }
}