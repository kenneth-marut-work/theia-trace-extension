import { injectable, postConstruct } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser";
import * as React from 'react';

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
            <div>Available Analysis</div>
        );
    }
}