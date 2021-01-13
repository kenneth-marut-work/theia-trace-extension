import { inject, injectable, postConstruct } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser";
import * as React from 'react';
import { List, ListRowProps } from 'react-virtualized';
import { Experiment } from 'tsp-typescript-client/lib/models/experiment';
import { ExperimentManager } from '@trace-viewer/base/lib/experiment-manager';
import { OutputDescriptor } from 'tsp-typescript-client/lib/models/output-descriptor';
import { Emitter } from '@theia/core';
import { TspClientProvider } from '../../tsp-client-provider';


@injectable()
export class TraceExplorerOpenedTracesWidget extends ReactWidget {
    static ID = 'trace-explorer-opened-traces-widget';
    static LABEL = 'Opened Traces';

    private static experimentSelectedEmitter = new Emitter<Experiment>();
    public static experimentSelectedSignal = TraceExplorerOpenedTracesWidget.experimentSelectedEmitter.event;

    protected _sharingLink = '';
    get sharingLink(): string {
        return this._sharingLink;
    }
    private openedExperiments: Array<Experiment> = [];
    private selectedExperimentIndex = 0;
    private experimentManager!: ExperimentManager;
    private selectedExperiment: Experiment | undefined;
    private showShareDialog = false;
    private lastSelectedOutputIndex = -1;
    private availableOutputDescriptors: Map<string, OutputDescriptor[]> = new Map();

    @inject(TspClientProvider) protected tspClientProvider!: TspClientProvider;

    @postConstruct()
    init(): void {
        this.id = TraceExplorerOpenedTracesWidget.ID;
        this.title.label = TraceExplorerOpenedTracesWidget.LABEL;

        this.experimentManager = this.tspClientProvider.getExperimentManager();
        this.tspClientProvider.addTspClientChangeListener(tspClient => {
            this.experimentManager = this.tspClientProvider.getExperimentManager();
        });
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

    private experimentRowRenderer(props: ListRowProps): React.ReactNode {
        let traceName = '';
        let tracePath = '';
        if (this.openedExperiments && this.openedExperiments.length && props.index < this.openedExperiments.length) {
            traceName = this.openedExperiments[props.index].name;
            // tracePath = this.openedTraces[props.index].path;
            /*
                TODO: Implement better visualization of experiment, e.g. a tree
                with experiment name as root and traces (name and path) as children
             */
            let prefix = '> ';
            for (let i = 0; i < this.openedExperiments[props.index].traces.length; i++) {
                // tracePath = tracePath.concat(prefix).concat(this.openedExperiments[props.index].traces[i].path);
                tracePath = tracePath.concat(prefix).concat(this.openedExperiments[props.index].traces[i].name);
                prefix = '\n> ';
            }
        }
        let traceContainerClassName = 'trace-element-container';
        if (props.index === this.selectedExperimentIndex) {
            traceContainerClassName = traceContainerClassName + ' theia-mod-selected';
        }
        this.handleShareButtonClick = this.handleShareButtonClick.bind(this);
        return <div className='trace-list-container' key={props.key} style={props.style}>
            <div className={traceContainerClassName}>
                <div className='trace-element-info' onClick={this.onExperimentSelected.bind(this, props.index)}>
                    <div className='trace-element-name'>
                        {traceName}
                    </div>
                    <div className='trace-element-path'>
                        {tracePath}
                    </div>
                </div>
                {/* <div className='trace-element-options'>
                    <button className='share-context-button' onClick={this.handleShareButtonClick.bind(this, props.index)}>
                        <FontAwesomeIcon icon={faShareSquare} />
                    </button>
                </div> */}
            </div>
        </div>;
    }

    private async updateOpenedExperiments() {
        this.openedExperiments = await this.experimentManager.getOpenedExperiments();
        const selectedIndex = this.openedExperiments.findIndex(experiment => this.selectedExperiment &&
            experiment.UUID === this.selectedExperiment.UUID);
        this.selectedExperimentIndex = selectedIndex !== -1 ? selectedIndex : 0;
        this.update();
    }

    private handleShareButtonClick(index: number) {
        const traceToShare = this.openedExperiments[index];
        this._sharingLink = 'https://localhost:3000/share/trace?' + traceToShare.UUID;
        this.showShareDialog = true;
        this.update();
    }

    private onExperimentSelected(index: number) {
        TraceExplorerOpenedTracesWidget.experimentSelectedEmitter.fire(this.openedExperiments[index]);
        this.selectExperiment(index);
    }

    private selectExperiment(index: number) {
        if (index >= 0 && index !== this.selectedExperimentIndex) {
            this.selectedExperimentIndex = index;
            this.lastSelectedOutputIndex = -1;
            this.updateAvailableAnalysis(this.openedExperiments[index]);
        }
    }

    private async updateAvailableAnalysis(experiment: Experiment | undefined) {
        if (experiment) {
            const outputs = await this.getOutputDescriptors(experiment);
            this.availableOutputDescriptors.set(experiment.UUID, outputs);
        } else {
            if (this.openedExperiments.length) {
                const outputs = await this.getOutputDescriptors(this.openedExperiments[0]);
                this.availableOutputDescriptors.set(this.openedExperiments[0].UUID, outputs);
            }
        }
        this.update();
    }

    private async getOutputDescriptors(experiment: Experiment): Promise<OutputDescriptor[]> {
        const outputDescriptors: OutputDescriptor[] = [];
        const descriptors = await this.experimentManager.getAvailableOutputs(experiment.UUID);
        if (descriptors && descriptors.length) {
            outputDescriptors.push(...descriptors);
        }
        return outputDescriptors;
    }
}