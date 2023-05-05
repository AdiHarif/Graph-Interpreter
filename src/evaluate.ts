import { BinaryOperationVertex, BinaryOperation, ReturnVertex, VertexKind, Value, ControlVertex, LiteralVertex, DataVertex } from 'graphir';
import { State } from './state'


export function evaluateDataNode(state: State, node: DataVertex): Value {
    let value: Value = 0;

    switch (node.kind) {
        case VertexKind.Literal:
            value = (<LiteralVertex>node).value as Value;
            return value;

        case VertexKind.BinaryOperation:
            value = evaluateBinaryNode(state, node as BinaryOperationVertex);
            return value;

        default:
            throw new Error(`Data node kind invalid or not implemented`);
    }
}

export function evaluateBinaryNode(state: State, node: BinaryOperationVertex): Value {
    let leftValue: Value = evaluateDataNode(state, node.left!);
    let rightValue: Value = evaluateDataNode(state, node.right!);

    if ((typeof leftValue === "number") && (typeof rightValue === "number")) {
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
            default: throw new Error(`Not implemented or invalid binary operator for numbers`);
        }
    }
    else {
        throw new Error(`Not implemented or invalid types of left and right value of binary operation`);
    }
}
