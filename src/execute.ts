import { ReturnVertex, VertexKind, Value, ControlVertex, DataVertex, BranchVertex } from 'graphir';
import { State } from './state'
import * as evaluate from './evaluate'

export function executeControlNode(state: State, node: ControlVertex) {
    switch (node.kind) {
        case VertexKind.Return:
            let returnedValue: Value =  evaluate.evaluateDataNode(state, (<ReturnVertex>node).value as DataVertex);
            state.setReturnedValue(returnedValue);
            break;
        default:
            throw new Error(`Control node kind invalid or not implemented`);
    }
}
