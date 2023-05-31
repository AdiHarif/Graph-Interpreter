
import { Graph, Vertex, ControlVertex, VertexKind, MergeVertex } from 'graphir';
import { State } from './state'
import * as execute from './execute'

export class ExecutionResult {
    
    private _finalState: State;
    
    constructor(finalState: State) {
        this._finalState = finalState;
    }

    queryVertexValue(vertex: Vertex): unknown {
        if (this._finalState.vertexExists(vertex.id) ==  false) {
            throw new Error(`Vertex value does not exist in the program final state`);
        }
        return this._finalState.getVertexData(vertex);
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
    let previousNode: ControlVertex | undefined = graph.getStartVertex();
    let currentNode: ControlVertex | undefined = graph.getStartVertex().next;
    let nextNode: ControlVertex | undefined;

    while (currentNode !== undefined) {
        nextNode = execute.executeControlNode(state, currentNode, previousNode);
        previousNode = currentNode;
        currentNode = nextNode;
    }
    
    return new ExecutionResult(state);
}
