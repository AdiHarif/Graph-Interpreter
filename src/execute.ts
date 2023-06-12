import { ReturnVertex, VertexKind, ControlVertex, DataVertex, StoreVertex, LoadVertex, NonTerminalControlVertex, MergeVertex, BranchVertex, Value, PhiEdge, PhiOperand, CallVertex, SymbolVertex } from 'graphir';
import { State, DataVariant, Property, ObjectFields } from './state';
import * as evaluate from './evaluate';
import { GraphInterpreter, log } from './interpreter';
import { RunTimeError } from './exceptions';

export function executeControlNode(interp: GraphInterpreter, node: ControlVertex, cameFrom: ControlVertex): ControlVertex | undefined {
    let state: State = interp.getTopState();
    
    switch (node.kind) {
        case VertexKind.Start: 
        case VertexKind.Pass:
            break;

        case VertexKind.Allocation:
            state.setVertexData(node, {});
            break;

        case VertexKind.Store:
            executeStoreNode(state, node as StoreVertex);
            break;

        case VertexKind.Load:
            executeLoadNode(state, node as LoadVertex);
            break;

        case VertexKind.Branch:
            return executeBranchNode(state, node as BranchVertex);

        case VertexKind.Merge:
            executeMergeNode(state, node as MergeVertex, cameFrom);
            break;

        case VertexKind.Call:
            return executeCallNode(interp, node as CallVertex);

        case VertexKind.Return:
            return executeReturnNode(interp, node as ReturnVertex);    

        default:
            throw new Error(`Control node kind ${node.kind} invalid or not implemented`);
    }

    // return the next node
    if (node instanceof NonTerminalControlVertex) {
        return node.next as ControlVertex;
    }
    throw new Error(`Reached a vertex without next edge`);
}

function executeStoreNode(state: State, node: StoreVertex) {
    // get the object
    let object: ObjectFields = evaluate.evaluateDataNode(state, node.object as DataVertex) as ObjectFields; // [TODO] check if really always true

    // get the property's name
    let propertyVertex: DataVertex = node.property as DataVertex;
    let property: Property = evaluate.evaluateDataNode(state, propertyVertex) as string;

    // get the value
    let valueVertex: DataVertex = node.value as DataVertex;
    let value: DataVariant = evaluate.evaluateDataNode(state, valueVertex);

    // store the value in the field
    object[property] = value;
}

function executeLoadNode(state: State, node: LoadVertex) {
    // get the object
    let object: ObjectFields = evaluate.evaluateDataNode(state, node.object as DataVertex) as ObjectFields;

    // get the property's name
    let propertyVertex: DataVertex = node.property as DataVertex;
    let property: Property = evaluate.evaluateDataNode(state, propertyVertex) as string;

    if (object[property] !== undefined) {
        // load the value of the field
        let value: DataVariant = object[property];

        // save the value in the top state
        state.setVertexData(node, value);
    }
    else {
        throw new RunTimeError(`Property "${property}" doesn't exist in object`);
    }
}

function executeBranchNode(state: State, node: BranchVertex): ControlVertex {
    let condition: Value = evaluate.evaluateDataNode(state, node.condition as DataVertex) as Value;
    if (condition == true) {
        return node.trueNext as ControlVertex;
    }
    return node.falseNext as ControlVertex;
}

function executeMergeNode(state: State, node: MergeVertex, cameFrom: ControlVertex) {
    // evaluate phi and set its value in the program state
    node.phiVertices.forEach( (phiNode) => {
        let phiOperands: Array<PhiOperand> = phiNode.outEdges.filter((edge) => edge instanceof PhiEdge).map((edge) => {
            return { value: edge.target, srcBranch: (<PhiEdge>edge).srcBranch } as PhiOperand;
        });
        phiOperands.forEach( (operand) => {
            if (operand.srcBranch == cameFrom) {
                let phiValue: DataVariant = evaluate.evaluateDataNode(state, operand.value);
                state.setVertexData(phiNode, phiValue);
                return;
            }
        });
    });
}

function executeCallNode(interp: GraphInterpreter, node: CallVertex): ControlVertex {
    let currentState: State = interp.getTopState();
    let newState: State = new State(node);

    // add the parameters values to the new state
    let args: Array<DataVertex> | undefined = node.args;
    args?.forEach( (argNode) => { // assumption: the args list is sorted by the position
        let argValue: DataVariant = evaluate.evaluateDataNode(currentState, argNode);
        newState.addParameterData(argValue);
    } );
    interp.pushState(newState);

    // the next control vertex is the start vertex of the callee
    let functionSymbol: SymbolVertex = node.callee as SymbolVertex;
    log.writeLogLine(`Call Function: ${node.callee?.label}`);
    return functionSymbol.startVertex as ControlVertex;
}

function executeReturnNode(interp: GraphInterpreter, node: ReturnVertex): ControlVertex | undefined {
    let terminatedState: State = interp.getTopState();
    let returnAddress: CallVertex | undefined = terminatedState.getReturnAddress();
    let returnedValue: DataVariant =  evaluate.evaluateDataNode(terminatedState, node.value as DataVertex);

    if (returnAddress !== undefined) {
        // end of function scope
        interp.popState();
        let state: State = interp.getTopState();

        // save the returned value as the call vertex's state
        state.setVertexData(returnAddress, returnedValue);

        return returnAddress.next;
    }
    // end of global state
    interp.setReturnedValue(returnedValue);
    return undefined;
}
