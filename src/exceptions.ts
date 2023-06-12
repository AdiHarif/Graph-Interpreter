import { log } from './interpreter';
import { State } from './state';

export class RunTimeError {
    public message: string = "RunTimeError: ";

    constructor(message: string) {
        this.message += message;
    }
}

export function handleException(state: State, error: RunTimeError) {
    log.writeLogLine(error.message);
    log.dumpState(state);
    log.closeLog();
    console.log(error.message);
}