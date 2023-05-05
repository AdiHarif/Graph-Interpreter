
import { Graph, Vertex, NonTerminalControlVertex, ControlVertex } from 'graphir';
import { State } from './state'
import * as execute from './execute'

export class ExecutionResult {
    
    private _finalState: State;
    
    constructor(finalState: State) {
        this._finalState = finalState;
    }

    queryVertexValue(vertex: Vertex): unknown {
        return this._finalState.getVertexValue(vertex);
    }

    returnValue(): unknown {
        return this._finalState.getReturnedValue();
    }
}

export function executeGraph(graph: Graph): ExecutionResult {
    if (graph.verify() == false) {
        throw new Error(`Invalid graph input`);
    }
    
    let state = new State();
    let currentNode: NonTerminalControlVertex = graph.getStartVertex().next!;

    while (currentNode !== undefined) {
        execute.executeControlNode(state, currentNode);
        currentNode = currentNode.next as ControlVertex;
    }

    return new ExecutionResult(state);
}
