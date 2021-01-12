import { injectable, inject } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import * as React from 'react';
import { List, ListRowProps } from 'react-virtualized';
import { OutputDescriptor } from 'tsp-typescript-client/lib/models/output-descriptor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { /* faShareSquare, */ faCopy } from '@fortawesome/free-solid-svg-icons';
import ReactModal from 'react-modal';
import { Emitter } from '@theia/core';
import { EditorManager, EditorOpenerOptions } from '@theia/editor/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { Experiment } from 'tsp-typescript-client/lib/models/experiment';
import { ExperimentManager } from '@trace-viewer/base/lib/experiment-manager';
import { TspClientProvider } from '../tsp-client-provider';
import { signalManager, Signals } from '@trace-viewer/base/lib/signal-manager';
/* FIXME: This may cause Circular dependency between trace-viewer and trace-explorer-widget */
import { TraceViewerWidget } from '../trace-viewer/trace-viewer';
import { TraceViewerContribution } from '../trace-viewer/trace-viewer-contribution';

import { ContextMenuRenderer } from '@theia/core/lib/browser';
import { PreferenceMenus } from './trace-explorer-contribution';

export const TRACE_EXPLORER_ID = 'trace-explorer';
export const TRACE_EXPLORER_LABEL = 'Trace Explorer';

export class OutputAddedSignalPayload {
    private outputDescriptor: OutputDescriptor;
    private experiment: Experiment;

    constructor(outputDescriptor: OutputDescriptor, trace: Experiment) {
        this.outputDescriptor = outputDescriptor;
        this.experiment = trace;
    }

    public getOutputDescriptor(): OutputDescriptor {
        return this.outputDescriptor;
    }

    public getExperiment(): Experiment {
        return this.experiment;
    }
}

@injectable()
export class TraceExplorerWidget extends ReactWidget {
    @inject(TraceViewerContribution)
    protected readonly traceViewerContribution!: TraceViewerContribution;

    @inject(ContextMenuRenderer) protected readonly contextMenuRenderer!: ContextMenuRenderer


    private OPENED_TRACE_TITLE = 'Opened Traces';
    // private FILE_NAVIGATOR_TITLE: string = 'File navigator';
    private ANALYSIS_TITLE = 'Available Analyses';

    private openedExperiments: Array<Experiment> = [];
    private selectedExperimentIndex = 0;
    private lastSelectedOutputIndex = -1;
    private availableOutputDescriptors: Map<string, OutputDescriptor[]> = new Map();

    private showShareDialog = false;
    private sharingLink = '';

    private tooltip: { [key: string]: string } = {};
    private selectedExperiment: Experiment | undefined;
    private experimentManager: ExperimentManager;

    private static outputAddedEmitter = new Emitter<OutputAddedSignalPayload>();
    public static outputAddedSignal = TraceExplorerWidget.outputAddedEmitter.event;

    private static experimentSelectedEmitter = new Emitter<Experiment>();
    public static experimentSelectedSignal = TraceExplorerWidget.experimentSelectedEmitter.event;

    constructor(
        @inject(TspClientProvider) private tspClientProvider: TspClientProvider,
        @inject(EditorManager) protected readonly editorManager: EditorManager,
    ) {
        super();
        this.id = TRACE_EXPLORER_ID;
        this.title.label = TRACE_EXPLORER_LABEL;
        this.title.caption = TRACE_EXPLORER_LABEL;
        this.title.iconClass = 'trace-explorer-tab-icon';
        this.experimentManager = this.tspClientProvider.getExperimentManager();
        signalManager().on(Signals.EXPERIMENT_OPENED, ({ experiment }) => this.onExperimentOpened(experiment));
        signalManager().on(Signals.EXPERIMENT_CLOSED, ({ experiment }) => this.onExperimentClosed(experiment));
        signalManager().on(Signals.EXPERIMENT_SELECTED, ({ experiment }) => this.onWidgetActivated(experiment));
        signalManager().on(Signals.TOOLTIP_UPDATED, ({ tooltip }) => this.onTooltip(tooltip));
        this.toDispose.push(TraceViewerWidget.widgetActivatedSignal(experiment => this.onWidgetActivated(experiment)));
        this.initialize();

        this.tspClientProvider.addTspClientChangeListener(tspClient => {
            this.experimentManager = this.tspClientProvider.getExperimentManager();
        });
    }

    dispose() {
        super.dispose();
        signalManager().off(Signals.EXPERIMENT_OPENED, ({ experiment }) => this.onExperimentOpened(experiment));
        signalManager().off(Signals.EXPERIMENT_CLOSED, ({ experiment }) => this.onExperimentClosed(experiment));
        signalManager().off(Signals.EXPERIMENT_SELECTED, ({ experiment }) => this.onWidgetActivated(experiment));
        signalManager().off(Signals.TOOLTIP_UPDATED, ({ tooltip }) => this.onTooltip(tooltip));
    }

    private onExperimentOpened(openedExperiment: Experiment) {
        this.updateOpenedExperiments();
        this.updateAvailableAnalysis(openedExperiment);
    }

    private onExperimentClosed(_closedExperiment: Experiment) {
        this.tooltip = {};
        this.updateOpenedExperiments();
        this.updateAvailableAnalysis(undefined);
    }

    private onTooltip(tooltip: { [key: string]: string }) {
        this.tooltip = tooltip;
        this.update();
    }

    async initialize(): Promise<void> {
        this.updateOpenedExperiments();
        this.updateAvailableAnalysis(undefined);
    }

    private async handleOpenTrace() {
        this.traceViewerContribution.openDialog();
    }

    protected handleContextMenuEvent = (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        const target = (event.target as HTMLElement);
        const domRect = target.getBoundingClientRect();
        this.contextMenuRenderer.render({
            menuPath: PreferenceMenus.PREFERENCE_EDITOR_CONTEXT_MENU,
            anchor: { x: domRect.left, y: domRect.bottom },
            args: []
        });
    }

    // private setMenuHidden() {
    //     console.log("Orey Laffoot ga idhi hidden function ra");
    // }

    // private setMenuShown() {
    //     console.log("Orey Laffoot ga idhi show function ra");
    // }

    protected render(): React.ReactNode {
        // this.updateOpenedExperiments = this.updateOpenedExperiments.bind(this);
        this.updateAvailableAnalysis = this.updateAvailableAnalysis.bind(this);
        this.experimentRowRenderer = this.experimentRowRenderer.bind(this);
        this.outputsRowRenderer = this.outputsRowRenderer.bind(this);
        this.handleShareModalClose = this.handleShareModalClose.bind(this);
        this.handleOpenTrace = this.handleOpenTrace.bind(this);

        let outputsRowCount = 0;
        if (this.openedExperiments.length) {
            const outputs = this.availableOutputDescriptors.get(this.openedExperiments[this.selectedExperimentIndex].UUID);
            if (outputs) {
                outputsRowCount = outputs.length;
            }

            return <div className='trace-explorer-container'>
                <ReactModal isOpen={this.showShareDialog} onRequestClose={this.handleShareModalClose}
                    ariaHideApp={false} className='sharing-modal' overlayClassName='sharing-overlay'>
                    {this.renderSharingModal()}
                </ReactModal>
                <div className='trace-explorer-opened'>
                    <div className='trace-explorer-panel-title' onClick={this.updateOpenedExperiments}>
                        {this.OPENED_TRACE_TITLE}
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
                <div className='trace-explorer-analysis'>
                    <div className='trace-explorer-panel-title'>
                        {this.ANALYSIS_TITLE}
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
                <div className='trace-explorer-tooltip'>
                    <div className='trace-explorer-panel-title'>
                        {'Time Graph Tooltip'}
                    </div>
                    <div className='trace-explorer-panel-content'>
                        {this.renderTooltip()}
                    </div>
                </div>
            </div>;
        }

        return <div className='theia-navigator-container' tabIndex={0}>
            <div className='center'>{'You have not yet opened a trace.'}</div>
            <div className='open-workspace-button-container'>
                <button className='theia-button open-workspace-button' title='Select a trace to open'
                    onClick={this.handleOpenTrace}>{'Open Trace'}</button>
            </div>
        </div>;
    }

    private renderTooltip() {
        this.handleSourcecodeLockup = this.handleSourcecodeLockup.bind(this);
        const tooltipArray: JSX.Element[] = [];
        if (this.tooltip) {
            const keys = Object.keys(this.tooltip);
            keys.forEach(key => {
                if (key === 'Source') {
                    const sourceCodeInfo = this.tooltip[key];
                    const matches = sourceCodeInfo.match('(.*):(\\d+)');
                    let fileLocation;
                    let line;
                    if (matches && matches.length === 3) {
                        fileLocation = matches[1];
                        line = matches[2];
                    }
                    tooltipArray.push(<p className='source-code-tooltip'
                        key={key}
                        onClick={this.handleSourcecodeLockup.bind(this, fileLocation, line)}>{key + ': ' + sourceCodeInfo}</p>);
                } else {
                    tooltipArray.push(<p key={key}>{key + ': ' + this.tooltip[key]}</p>);
                }
            });
        }

        return <React.Fragment>
            {tooltipArray.map(element => element)}
        </React.Fragment>;
    }

    private handleSourcecodeLockup(fileLocation: string | undefined, line: string | undefined) {
        if (fileLocation) {
            const modeOpt: EditorOpenerOptions = {
                mode: 'open'
            };
            let slectionOpt = {
                selection: {
                    start: {
                        line: 0,
                        character: 0
                    },
                    end: {
                        line: 0,
                        character: 0
                    }
                }
            };
            if (line) {
                const lineNumber = parseInt(line);
                slectionOpt = {
                    selection: {
                        start: {
                            line: lineNumber,
                            character: 0
                        },
                        end: {
                            line: lineNumber,
                            character: 0
                        }
                    }
                };
            }
            const opts = {
                ...modeOpt,
                ...slectionOpt
            };
            this.editorManager.open(new URI(fileLocation), opts);
        }
    }

    private renderSharingModal() {
        if (this.sharingLink.length) {
            return <div className='sharing-container'>
                <div className='sharing-description'>
                    {'Copy URL to share your trace context'}
                </div>
                <div className='sharing-link-info'>
                    <div className='sharing-link'>
                        <textarea rows={1} cols={this.sharingLink.length} readOnly={true} value={this.sharingLink} />
                    </div>
                    <div className='sharing-link-copy'>
                        <button className='copy-link-button'>
                            <FontAwesomeIcon icon={faCopy} />
                        </button>
                    </div>
                </div>
            </div>;
        }
        return <div style={{ color: 'white' }}>
            {'Cannot share this trace'}
        </div>;
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
                <div className='trace-element-info' onClick={this.onExperimentSelected.bind(this, props.index)}
                    onContextMenu={this.handleContextMenuEvent.bind(this)}>
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

    private onWidgetActivated(experiment: Experiment) {
        this.selectedExperiment = experiment;
        const selectedIndex = this.openedExperiments.findIndex(openedExperiment => openedExperiment.UUID === experiment.UUID);
        this.selectExperiment(selectedIndex);
    }

    private onExperimentSelected(index: number) {
        TraceExplorerWidget.experimentSelectedEmitter.fire(this.openedExperiments[index]);
        this.selectExperiment(index);
    }

    private selectExperiment(index: number) {
        if (index >= 0 && index !== this.selectedExperimentIndex) {
            this.selectedExperimentIndex = index;
            this.lastSelectedOutputIndex = -1;
            this.updateAvailableAnalysis(this.openedExperiments[index]);
        }
    }

    private handleShareButtonClick(index: number) {
        const traceToShare = this.openedExperiments[index];
        this.sharingLink = 'https://localhost:3000/share/trace?' + traceToShare.UUID;
        this.showShareDialog = true;
        this.update();
    }

    private handleShareModalClose() {
        this.showShareDialog = false;
        this.sharingLink = '';
        this.update();
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

    private outputClicked(index: number) {
        this.lastSelectedOutputIndex = index;
        const trace = this.openedExperiments[this.selectedExperimentIndex];
        const outputs = this.availableOutputDescriptors.get(trace.UUID);
        if (outputs) {
            TraceExplorerWidget.outputAddedEmitter.fire(new OutputAddedSignalPayload(outputs[index], trace));
        }
        this.update();
    }

    private async updateOpenedExperiments() {
        this.openedExperiments = await this.experimentManager.getOpenedExperiments();
        const selectedIndex = this.openedExperiments.findIndex(experiment => this.selectedExperiment &&
            experiment.UUID === this.selectedExperiment.UUID);
        this.selectedExperimentIndex = selectedIndex !== -1 ? selectedIndex : 0;
        this.update();
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
