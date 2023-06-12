import assert from 'assert';
import { Graph, Vertex, ControlVertex } from 'graphir';
import { State, DataVariant } from './state';
import * as execute from './execute';
import { DebugLog } from './log';
import { handleException } from './exceptions';

export var log: DebugLog;

export class ExecutionResult {
    
    private _finalState?: State;
    private _returnedValue: DataVariant | undefined;
    
    constructor(returnedValue: DataVariant | undefined, finalState?: State) {
        this._finalState = finalState;
        this._returnedValue = returnedValue;
    }

    queryVertexValue(vertex: Vertex): unknown {
        if (this._finalState) {
            assert(this._finalState.vertexExistsInMap(vertex.id), `Vertex value does not exist in the program final state`);
            return this._finalState.getVertexData(vertex);
        }
        return undefined;
    }

    returnValue(): unknown {
        return this._returnedValue;
    }
}

export function executeGraph(graph: Graph): ExecutionResult {
    if (graph.verify() == false) {
        throw new Error(`Invalid graph input`);
    }
    
    log = new DebugLog();
    log.createLog();

    let interp: GraphInterpreter = new GraphInterpreter();
    let globalState: State = new State(undefined);
    interp.pushState(globalState);

    let previousNode: ControlVertex | undefined = graph.getStartVertex();
    let currentNode: ControlVertex | undefined = graph.getStartVertex().next;
    let nextNode: ControlVertex | undefined;

    while (currentNode !== undefined) {
        log.startNode(currentNode);
        try {
            nextNode = execute.executeControlNode(interp, currentNode, previousNode);
        }
        catch (error: any) {
            handleException(interp.getTopState(), error);
            return new ExecutionResult(undefined);
        }
        log.endNode(currentNode);
        log.dumpState(interp.getTopState());

        previousNode = currentNode;
        currentNode = nextNode;
    }
    log.closeLog();
    
    return new ExecutionResult(interp.getReturnedValue(), interp.getTopState());
}

export class GraphInterpreter {

    private _statesStack: Array<State> = []
    private _programReturnedValue: DataVariant = 0; // assumption: the program always returns a value

    setReturnedValue(returnedValue: DataVariant) {
        this._programReturnedValue = returnedValue;
    }

    getReturnedValue(): DataVariant {
        return this._programReturnedValue;
    }

    pushState(newState: State) {
        this._statesStack.push(newState);
    }

    popState() {
        this._statesStack.pop();
    }

    getTopState() {
        return this._statesStack[this._statesStack.length - 1];
    }
}