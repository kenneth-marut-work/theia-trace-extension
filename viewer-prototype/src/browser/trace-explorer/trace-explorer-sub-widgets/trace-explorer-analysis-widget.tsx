import { injectable } from 'inversify';
import { ReactWidget } from "@theia/core/lib/browser";
import * as React from 'react';

@injectable()
export class TraceExplorerAnalysisWidget extends ReactWidget {
    static ID = 'trace-explorer-analysis-widget';
    static LABEL = 'Available Analysis';

    render(): React.ReactNode {
        return (
            <div>HELLO</div>
        );
    }
}