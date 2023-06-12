import assert from 'assert';
import { BinaryOperationVertex, BinaryOperation, VertexKind, Value, LiteralVertex, DataVertex, ParameterVertex } from 'graphir';
import { State, DataVariant } from './state'

export function evaluateDataNode(state: State, node: DataVertex): DataVariant {
    switch (node.kind) {
        case VertexKind.Literal:
            return (<LiteralVertex>node).value as Value;

        case VertexKind.BinaryOperation:
            return evaluateBinaryNode(state, node as BinaryOperationVertex);

        case VertexKind.Allocation:
        case VertexKind.Load:
        case VertexKind.Phi:
        case VertexKind.Call:
            assert(state.vertexExistsInMap(node.id), `${node.kind} vertex's value does not exist in the top state`);
            return state.getVertexData(node);
        
        case VertexKind.Parameter:
            assert(state.parameterExist((<ParameterVertex>node).position as number), `Parameter vertex's value does not exist in the top state`);
            return state.getParameterData(node as ParameterVertex);

        default:
            throw new Error(`Data node kind ${node.kind} invalid or not implemented`);
    }
}

function evaluateBinaryNode(state: State, node: BinaryOperationVertex): Value {
    let leftValue: any = evaluateDataNode(state, node.left!);
    let rightValue: any = evaluateDataNode(state, node.right!);

    switch (node.operator) {
        case BinaryOperation.Add: return (leftValue + rightValue);
        case BinaryOperation.Sub: return (leftValue - rightValue);
        case BinaryOperation.Mul: return (leftValue * rightValue);
        case BinaryOperation.Div: return (leftValue / rightValue);
        case BinaryOperation.LessThan: return (leftValue < rightValue);
        case BinaryOperation.GreaterThan: return (leftValue > rightValue);
        case BinaryOperation.LessThanEqual: return (leftValue <= rightValue);
        case BinaryOperation.GreaterThanEqual: return (leftValue >= rightValue);
        case BinaryOperation.EqualEqual: return (leftValue == rightValue);
        case BinaryOperation.NotEqual: return (leftValue != rightValue);
        case BinaryOperation.EqualEqualEqual: return (leftValue === rightValue);
        case BinaryOperation.NotEqualEqual: return (leftValue !== rightValue);
        case BinaryOperation.And: return (leftValue && rightValue);
        case BinaryOperation.Or: return (leftValue || rightValue);
        default: throw new Error(`Not implemented or invalid binary operator`);
    }
}
