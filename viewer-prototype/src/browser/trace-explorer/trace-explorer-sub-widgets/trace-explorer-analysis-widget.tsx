import { inject, injectable, postConstruct } from 'inversify';
import { ReactWidget, Widget } from "@theia/core/lib/browser";
import * as React from 'react';
import { List, ListRowProps } from 'react-virtualized';
import { TraceExplorerOpenedTracesWidget } from './trace-explorer-opened-traces-widget';
import { Emitter } from '@theia/core';
import { OutputAddedSignalPayload } from '../output-added-signal-payload';

@injectable()
export class TraceExplorerAnalysisWidget extends ReactWidget {
    static ID = 'trace-explorer-analysis-widget';
    static LABEL = 'Available Analysis';

    protected outputAddedEmitter = new Emitter<OutputAddedSignalPayload>();
    outputAddedSignal = this.outputAddedEmitter.event;

    @inject(TraceExplorerOpenedTracesWidget) protected readonly openedTracesWidget!: TraceExplorerOpenedTracesWidget;

    @postConstruct()
    init(): void {
        this.id = TraceExplorerAnalysisWidget.ID;
        this.title.label = TraceExplorerAnalysisWidget.LABEL;
        this.toDispose.push(this.openedTracesWidget.availableOutputDescriptorsDidChange(() => {
            this.update();
        }))
        this.update();
    }

    render(): React.ReactNode {
        this.outputsRowRenderer = this.outputsRowRenderer.bind(this);
        const { clientHeight, clientWidth } = this.node.parentElement!;
        const { openedExperiments, availableOutputDescriptors, selectedExperimentIndex } = this.openedTracesWidget;
        let outputsRowCount = 0;
        const outputs = availableOutputDescriptors.get(openedExperiments[selectedExperimentIndex].UUID);
        if (outputs) {
            outputsRowCount = outputs.length;
        }
        return (
            <div className='trace-explorer-analysis'>
                {/* <div className='trace-explorer-panel-title'>
                    {TraceExplorerAnalysisWidget.LABEL}
                </div> */}
                <div className='trace-explorer-panel-content'>
                    <List
                        height={clientHeight}
                        width={clientWidth}
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
        const { openedExperiments, availableOutputDescriptors, selectedExperimentIndex, lastSelectedOutputIndex } = this.openedTracesWidget;
        const selectedTrace = openedExperiments[selectedExperimentIndex];
        if (selectedTrace) {
            const outputDescriptors = availableOutputDescriptors.get(selectedTrace.UUID);
            if (outputDescriptors && outputDescriptors.length && props.index < outputDescriptors.length) {
                outputName = outputDescriptors[props.index].name;
                outputDescription = outputDescriptors[props.index].description;
            }
        }
        let traceContainerClassName = 'outputs-list-container';
        if (props.index === lastSelectedOutputIndex) {
            traceContainerClassName = traceContainerClassName + ' theia-mod-selected';
        }
        return <div className={traceContainerClassName}
            id={`${traceContainerClassName}-${props.index}`}
            key={props.key}
            style={props.style}
            onClick={this.outputClicked.bind(this, props.index)}
        >
            <div className='outputs-element-name'>
                {outputName}
            </div>
            <div className='outputs-element-description'>
                {outputDescription}
            </div>
        </div>;
    }

    private outputClicked(index: number) {
        const { openedExperiments, selectedExperimentIndex, availableOutputDescriptors } = this.openedTracesWidget;
        this.openedTracesWidget.lastSelectedOutputIndex = index;
        const trace = openedExperiments[selectedExperimentIndex];
        const outputs = availableOutputDescriptors.get(trace.UUID);
        if (outputs) {
            this.outputAddedEmitter.fire(new OutputAddedSignalPayload(outputs[index], trace));
        }
        this.update();
    }

    onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg);
        this.update();
    }
}