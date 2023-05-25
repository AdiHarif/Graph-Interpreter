import { ReturnVertex, VertexKind, ControlVertex, DataVertex, StoreVertex, LoadVertex } from 'graphir';
import { State, VertexId, DataVariant, Property } from './state'
import * as evaluate from './evaluate'

export function executeControlNode(state: State, node: ControlVertex) {
    switch (node.kind) {
        case VertexKind.Return:
            let returnedValue: DataVariant =  evaluate.evaluateDataNode(state, (<ReturnVertex>node).value as DataVertex);
            state.setReturnedValue(returnedValue);
            break;

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

        default:
            throw new Error(`Control node kind invalid or not implemented`);
    }
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