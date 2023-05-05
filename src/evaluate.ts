import { BinaryOperationVertex, ReturnVertex, VertexKind, Value, ControlVertex, LiteralVertex, DataVertex } from 'graphir';
import { GraphInterpreter } from './interpreter'
import { BinaryOperation } from '../../TS-Graph-Extractor/src/types'

export function evaluateControlNode(node: ControlVertex): Value {
    switch (node.kind) {
        case VertexKind.Return:
            return evaluateDataNode((<ReturnVertex>node).value as DataVertex);
        default:
            throw new Error(`Control node kind invalid or not implemented`);
    }
}

export function evaluateDataNode(node: DataVertex): Value {
    let value: Value = 0;

    switch (node.kind) {
        case VertexKind.Literal:
            value = (<LiteralVertex>node).value as Value;
            GraphInterpreter.getInstance().state.setVertexValue(node.id, value);
            return value;

        case VertexKind.BinaryOperation:
            value = evaluateBinaryNode(node as BinaryOperationVertex);
            GraphInterpreter.getInstance().state.setVertexValue(node.id, value);
            return value;

        default:
            throw new Error(`Data node kind invalid or not implemented`);     
    }
}

export function evaluateBinaryNode(node: BinaryOperationVertex): Value {
    let leftValue: Value = evaluateDataNode(node.left!);
    let rightValue: Value = evaluateDataNode(node.right!);

    if ((typeof leftValue === "number") && (typeof rightValue === "number")) {
        switch (node.operator) {
            case BinaryOperation.Add: return (leftValue + rightValue);
            case BinaryOperation.Sub: return (leftValue - rightValue);
            case BinaryOperation.Mul: return (leftValue * rightValue);
            // [TODO] check division by zero?
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
