import assert from 'assert';
import { Vertex} from 'graphir';
import { State } from './state'
import { DataVariant } from './concrete_interpreter';

/**
 * Utility class for creating and managing a debug log file for debugging purposes.
 * You can use this class to log messages and debug information during program execution.
 * This is useful to synchronize actions when running jest, which is executed in parallel.
 */
export class DebugLog {
    private fs;
    private fd: any;

    public constructor() {
        this.fs = require('fs');
    }

    public createLog() {
        this.fd = this.fs.openSync('log.txt', 'w');
        assert(this.fd !== undefined, `DebugLog failed to open a new file`)
        this.fs.writeSync(this.fd, `createLog\n`);
        this.fs.writeSync(this.fd, `-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-\n`);
    }

    public closeLog() {
        this.fs.writeSync(this.fd, `-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-\n`);
        this.fs.writeSync(this.fd, `closeLog\n`);
        this.fs.closeSync(this.fd);
    }

    public startNode(node: Vertex) {
        this.fs.writeSync(this.fd, `# --- start --- vertex-${node.id} --- kind-${node.kind} ---\n`);
    }

    public endNode(node: Vertex) {
        this.fs.writeSync(this.fd, `# --- end --- vertex-${node.id} --- kind-${node.kind} ---\n`);
    }

    public dumpState(state: State<DataVariant>) {
        this.fs.writeSync(this.fd, `The top state in the stack:\n`);
        let printList = state.peek();
        for (let line of printList) {
            this.fs.writeSync(this.fd, line);
        }
    }

    public writeLogLine(line: string) {
        this.fs.writeSync(this.fd, line + `\n`);
    }
}
