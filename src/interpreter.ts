
import { Graph, Value, NonTerminalControlVertex, ControlVertex } from 'graphir';
import { State } from './state'
import * as evaluate from './evaluate'

export class ExecutionResult {
    
    private _finalState: State;
    private _returnedValue: Value;
    
    constructor(finalState: State, returnedValue: Value) {
        this._finalState = finalState;
        this._returnedValue = returnedValue;
    }

    queryVertexValue(id: number): unknown {
        return this._finalState.getVertexValue(id);
    }

    returnValue(): unknown {
        return this._returnedValue;
    }
}

export function executeGraph(graph: Graph): ExecutionResult {
    if (graph.verify() == false) {
        throw new Error(`Invalid graph input`);
    }
    let graphInterp = GraphInterpreter.getInstance();
    let nodeValue: Value = 0;
    let currentNode: NonTerminalControlVertex = graph.startVertex!.next!;

    while (currentNode !== undefined) {
        if (currentNode.verify() == false) {
            throw new Error(`Invalid vertex`);
        }
        if (graphInterp.state.vertexValueExists(currentNode.id) == false) {
            nodeValue = evaluate.evaluateControlNode(currentNode);
            graphInterp.state.setVertexValue(currentNode.id, nodeValue);
        }
        currentNode = currentNode.next as ControlVertex;
    }
    //console.log(graphInterp.state);
    return new ExecutionResult(graphInterp.state, nodeValue);
}

export class GraphInterpreter {
    
    private static instance: GraphInterpreter;
    public state: State;

    private constructor() {
        this.state = new State();
    }

    public static getInstance(): GraphInterpreter {
        if (!this.instance) {
            this.instance = new GraphInterpreter();
        }
        return GraphInterpreter.instance;
    }
}