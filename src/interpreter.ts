
import { Graph, Vertex, NonTerminalControlVertex, ControlVertex, VertexKind } from 'graphir';
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
    let currentNode: ControlVertex = graph.getStartVertex().next!;

    while (currentNode !== undefined) {
        execute.executeControlNode(state, currentNode);

        if (currentNode instanceof NonTerminalControlVertex) {
            currentNode = currentNode.next as ControlVertex;
        }
        else if (currentNode.kind == VertexKind.Return) {
            break;
        }
        else {
            throw new Error(`Reached a branch vertex - not implemented`);
        }
    }

    return new ExecutionResult(state);
}
