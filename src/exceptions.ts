/**
 * Custom runtime error class for distinguishing runtime exceptions
 * of the executed graph from the exceptions of the interpreter itself.
 */
export class RunTimeError {
    public message: string = "RunTimeError: ";

    constructor(message: string) {
        this.message += message;
    }
}
