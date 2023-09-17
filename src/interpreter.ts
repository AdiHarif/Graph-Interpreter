import assert from 'assert';
import { State } from './state';
import { DataVariant } from './concrete_interpreter';
import { Graph, Vertex, ControlVertex } from 'graphir';
import { ConcreteInterpreter } from './concrete_interpreter';
import { RunTimeError } from './exceptions';

export class ExecutionResult {
    private _finalState?: State<DataVariant>;
    private _returnedValue: DataVariant | undefined;
    
    constructor(returnedValue: DataVariant | undefined, finalState?: State<DataVariant>) {
        this._finalState = finalState;
        this._returnedValue = returnedValue;
    }

    public queryVertexValue(vertex: Vertex): unknown {
        if (this._finalState) {
            assert(this._finalState.vertexExistsInMap(vertex.id), `Vertex value does not exist in the program final state`);
            return this._finalState.getVertexData(vertex);
        }
        return undefined;
    }

    public returnValue(): unknown {
        return this._returnedValue;
    }
}

/**
 * Executes a graph using a concrete interpreter, simulating the program's execution.
 *
 * @param graph - The graph to execute, representing the program's control flow.
 * @returns An `ExecutionResult` containing the final state and returned value of the program.
 * @throws An error if the graph is invalid or if a runtime error occurs during execution.
 */
export function executeGraph(graph: Graph): ExecutionResult {
    if (graph.verify() == false) {
        throw new Error(`Invalid graph input`);
    }

    let interp: ConcreteInterpreter = new ConcreteInterpreter([]);
    let globalState: State<DataVariant> = new State(undefined);
    interp.pushState(globalState);

    interp.log.createLog();

    let previousNode: ControlVertex | undefined = graph.getStartVertex();
    let currentNode: ControlVertex | undefined = graph.getStartVertex().next;
    let nextNode: ControlVertex | undefined;

    while (currentNode !== undefined) {
        interp.log.startNode(currentNode);
        try {
            nextNode = interp.executeControlNode(currentNode, previousNode);
        }
        catch (error: any) {
            if (error instanceof RunTimeError) {
                console.log(error.message)
                return new ExecutionResult(undefined);
            }
            else {
                throw new Error("Unknown interpreter error")
            }
        }
        interp.log.endNode(currentNode);
        interp.log.dumpState(interp.getTopState());

        previousNode = currentNode;
        currentNode = nextNode;
    }
    interp.log.closeLog();
    
    return new ExecutionResult(interp.getReturnedValue(), interp.getTopState());
}
