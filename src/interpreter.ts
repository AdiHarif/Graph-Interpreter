
import { Graph } from 'graphir';


export class ExecutionResult{
    constructor() {}

    queryVertexValue(id: number): unknown {
        //TODO: implement
        return undefined;
    };


    returnValue(): unknown {
        return 1;
    }
}

export function executeGraph(graph: Graph): ExecutionResult {
    return new ExecutionResult();
}
