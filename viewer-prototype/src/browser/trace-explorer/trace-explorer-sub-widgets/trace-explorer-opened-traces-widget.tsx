import { inject, injectable, postConstruct } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser";
import * as React from 'react';
import { List, ListRowProps } from 'react-virtualized';
import { Experiment } from 'tsp-typescript-client/lib/models/experiment';
import { ExperimentManager } from '@trace-viewer/base/lib/experiment-manager';
import { OutputDescriptor } from 'tsp-typescript-client/lib/models/output-descriptor';
import { Emitter } from '@theia/core';
import { TspClientProvider } from '../../tsp-client-provider';
import { signalManager, Signals } from '@trace-viewer/base/lib/signal-manager';
import { TraceExplorerTooltipWidget } from './trace-explorer-tooltip-widget';


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
    set sharingLink(link: string) {
        this._sharingLink = link;
    }
    protected _openedExperiments: Array<Experiment> = [];
    get openedExperiments(): Array<Experiment> {
        return this._openedExperiments;
    }

    protected _selectedExperimentIndex = 0;
    get selectedExperimentIndex(): number {
        return this._selectedExperimentIndex;
    }
    private experimentManager!: ExperimentManager;
    private selectedExperiment: Experiment | undefined;
    private _showShareDialog = false;
    get showShareDialog(): boolean {
        return this._showShareDialog;
    }
    set showShareDialog(doShow: boolean) {
        this._showShareDialog = doShow;
    }
    private lastSelectedOutputIndex = -1;
    protected _availableOutputDescriptors: Map<string, OutputDescriptor[]> = new Map();
    get availableOutputDescriptors(): Map<string, OutputDescriptor[]> {
        return this._availableOutputDescriptors;
    }

    @inject(TspClientProvider) protected readonly tspClientProvider!: TspClientProvider;
    @inject(TraceExplorerTooltipWidget) protected readonly tooltipWidget!: TraceExplorerTooltipWidget;

    @postConstruct()
    init(): void {
        this.id = TraceExplorerOpenedTracesWidget.ID;
        this.title.label = TraceExplorerOpenedTracesWidget.LABEL;

        signalManager().on(Signals.EXPERIMENT_OPENED, ({ experiment }) => this.onExperimentOpened(experiment));
        signalManager().on(Signals.EXPERIMENT_CLOSED, ({ experiment }) => this.onExperimentClosed(experiment))
        signalManager().on(Signals.EXPERIMENT_SELECTED, ({ experiment }) => this.onWidgetActivated(experiment));

        this.experimentManager = this.tspClientProvider.getExperimentManager();
        this.tspClientProvider.addTspClientChangeListener(tspClient => {
            this.experimentManager = this.tspClientProvider.getExperimentManager();
        });
        this.initialize();
        this.update();
    }

    dispose() {
        super.dispose();
        signalManager().off(Signals.EXPERIMENT_OPENED, ({ experiment }) => this.onExperimentOpened(experiment));
        signalManager().off(Signals.EXPERIMENT_CLOSED, ({ experiment }) => this.onExperimentClosed(experiment));
        signalManager().off(Signals.EXPERIMENT_SELECTED, ({ experiment }) => this.onWidgetActivated(experiment));
    }

    async initialize(): Promise<void> {
        this.updateOpenedExperiments();
        this.updateAvailableAnalysis(undefined);
    }

    private onExperimentOpened(openedExperiment: Experiment) {
        this.updateOpenedExperiments();
        this.updateAvailableAnalysis(openedExperiment);
    }

    private onExperimentClosed(_closedExperiment: Experiment) {
        this.tooltipWidget.tooltip = {};
        this.updateOpenedExperiments();
        this.updateAvailableAnalysis(undefined);
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
                        rowCount={this._openedExperiments.length}
                        rowHeight={50}
                        rowRenderer={this.experimentRowRenderer} />
                </div>
            </div>
        );
    }

    private experimentRowRenderer = (props: ListRowProps): React.ReactNode => {
        let traceName = '';
        let tracePath = '';
        if (this._openedExperiments && this._openedExperiments.length && props.index < this._openedExperiments.length) {
            traceName = this._openedExperiments[props.index].name;
            // tracePath = this.openedTraces[props.index].path;
            /*
                TODO: Implement better visualization of experiment, e.g. a tree
                with experiment name as root and traces (name and path) as children
             */
            let prefix = '> ';
            for (let i = 0; i < this._openedExperiments[props.index].traces.length; i++) {
                // tracePath = tracePath.concat(prefix).concat(this.openedExperiments[props.index].traces[i].path);
                tracePath = tracePath.concat(prefix).concat(this._openedExperiments[props.index].traces[i].name);
                prefix = '\n> ';
            }
        }
        let traceContainerClassName = 'trace-element-container';
        if (props.index === this._selectedExperimentIndex) {
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
        this._openedExperiments = await this.experimentManager.getOpenedExperiments();
        const selectedIndex = this._openedExperiments.findIndex(experiment => this.selectedExperiment &&
            experiment.UUID === this.selectedExperiment.UUID);
        this._selectedExperimentIndex = selectedIndex !== -1 ? selectedIndex : 0;
        this.update();
    }

    private handleShareButtonClick(index: number) {
        const traceToShare = this._openedExperiments[index];
        this._sharingLink = 'https://localhost:3000/share/trace?' + traceToShare.UUID;
        this._showShareDialog = true;
        this.update();
    }

    private onExperimentSelected(index: number) {
        TraceExplorerOpenedTracesWidget.experimentSelectedEmitter.fire(this._openedExperiments[index]);
        this.selectExperiment(index);
    }

    private selectExperiment(index: number) {
        if (index >= 0 && index !== this._selectedExperimentIndex) {
            this._selectedExperimentIndex = index;
            this.lastSelectedOutputIndex = -1;
            this.updateAvailableAnalysis(this._openedExperiments[index]);
        }
    }

    private updateAvailableAnalysis = async (experiment: Experiment | undefined) => {
        if (experiment) {
            const outputs = await this.getOutputDescriptors(experiment);
            this._availableOutputDescriptors.set(experiment.UUID, outputs);
        } else {
            if (this._openedExperiments.length) {
                const outputs = await this.getOutputDescriptors(this._openedExperiments[0]);
                this._availableOutputDescriptors.set(this._openedExperiments[0].UUID, outputs);
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

    private onWidgetActivated(experiment: Experiment) {
        this.selectedExperiment = experiment;
        const selectedIndex = this._openedExperiments.findIndex(openedExperiment => openedExperiment.UUID === experiment.UUID);
        this.selectExperiment(selectedIndex);
    }

    private handleShareModalClose = () => {
        this.showShareDialog = false;
        this.sharingLink = '';
        this.update();
    }
}