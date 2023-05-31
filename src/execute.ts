import { ReturnVertex, VertexKind, ControlVertex, DataVertex, StoreVertex, LoadVertex, NonTerminalControlVertex, MergeVertex, BranchVertex, Value, PhiEdge, PhiOperand } from 'graphir';
import { State, VertexId, DataVariant, Property } from './state'
import * as evaluate from './evaluate'

export function executeControlNode(state: State, node: ControlVertex, cameFrom: ControlVertex): ControlVertex | undefined {
    switch (node.kind) {
        case VertexKind.Return:
            let returnedValue: DataVariant =  evaluate.evaluateDataNode(state, (<ReturnVertex>node).value as DataVertex);
            state.setReturnedValue(returnedValue);
            return undefined;

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
            return executeMergeNode(state, node as MergeVertex, cameFrom);

        default:
            throw new Error(`Control node kind invalid or not implemented`);
    }

    // return the next node
    if (node instanceof NonTerminalControlVertex) {
        return node.next as ControlVertex;
    }
    throw new Error(`Reached a vertex without next edge`);
}

function executeStoreNode(state: State, node: StoreVertex) {
    // get the object vertex's id
    let objectId: VertexId = node.object?.id as VertexId;
    if (state.vertexExists(objectId) ==  false) {
        throw new Error(`Store vertex's object vertex does not exist in the program state`);
    }

    // get the property's name
    let propertyVertex: DataVertex = node.property as DataVertex;
    let property: Property = evaluate.evaluateDataNode(state, propertyVertex) as string;

    // get the value
    let valueVertex: DataVertex = node.value as DataVertex;
    let value: DataVariant = evaluate.evaluateDataNode(state, valueVertex);

    // store the value in the program state
    state.setObjectField(objectId, property, value);
}

function executeLoadNode(state: State, node: LoadVertex) {
    // get the object vertex's id
    let objectId: VertexId = node.object?.id as VertexId;
    if (state.vertexExists(objectId) ==  false) {
        throw new Error(`Load vertex's object vertex does not exist in the program state`);
    }

    // get the property's name
    let propertyVertex: DataVertex = node.property as DataVertex;
    let property: Property = evaluate.evaluateDataNode(state, propertyVertex) as string;

    // load the value from the program state
    let value: DataVariant = state.getObjectField(objectId, property);

    state.setVertexData(node, value);
}

function executeBranchNode(state: State, node: BranchVertex): ControlVertex {
    let condition: Value = evaluate.evaluateDataNode(state, node.condition as DataVertex) as Value;
    if (condition == true) {
        return node.trueNext as ControlVertex;
    }
    return node.falseNext as ControlVertex;
}

function executeMergeNode(state: State, node: MergeVertex, cameFrom: ControlVertex): ControlVertex {
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
    return node.next as ControlVertex;
}