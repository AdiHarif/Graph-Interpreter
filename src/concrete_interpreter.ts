import { GraphInterpreter } from './graph_interpreter';
import * as ir from 'graphir';
import { State } from './state';
import { Value } from 'graphir';
import { RunTimeError } from './exceptions';
import { Property } from './graph_interpreter';

export type ConcreteObjectFields = { [key: Property]: DataVariant }
export type DataVariant = Value | ConcreteObjectFields;

export class ConcreteInterpreter extends GraphInterpreter<DataVariant> {
    private _programReturnedValue: DataVariant = NaN;

    constructor(statesStack: Array<State<DataVariant>>) {
        super(statesStack);
    }

    protected setReturnedValue(returnedValue: DataVariant) {
        this._programReturnedValue = returnedValue;
    }

    public getReturnedValue(): DataVariant {
        return this._programReturnedValue;
    }

    /* EXECUTE */

    protected executeStoreNode(state: State<DataVariant>, node: ir.StoreVertex) {
        // get the object
        let object: ConcreteObjectFields = this.evaluateDataNode(state, node.object as ir.DataVertex) as ConcreteObjectFields; // [TODO] check if really always true
    
        // get the property's name
        let propertyVertex: ir.LiteralVertex = node.property as ir.LiteralVertex;
        let property: Property = propertyVertex.value as string;

        // get the value
        let valueVertex: ir.DataVertex = node.value as ir.DataVertex;
        let value: DataVariant = this.evaluateDataNode(state, valueVertex);
    
        // store the value in the field
        object[property] = value;
    }
    
    protected executeLoadNode(state: State<DataVariant>, node: ir.LoadVertex) {
        // get the object
        let object: ConcreteObjectFields = this.evaluateDataNode(state, node.object as ir.DataVertex) as ConcreteObjectFields;
    
        // get the property's name
        let propertyVertex: ir.LiteralVertex = node.property as ir.LiteralVertex;
        let property: Property = propertyVertex.value as string;
    
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

    /* EVALUATE */

    evaluateLiteralNode(node: ir.LiteralVertex): DataVariant {
        return node.value!;
    }
    
    evaluateBinaryNode(state: State<DataVariant>, node: ir.BinaryOperationVertex): Value {
        let leftValue: any = this.evaluateDataNode(state, node.left!);
        let rightValue: any = this.evaluateDataNode(state, node.right!);
    
        switch (node.operator) {
            case ir.BinaryOperation.Add:
                return (leftValue + rightValue);
            case ir.BinaryOperation.Sub:
                return (leftValue - rightValue);
            case ir.BinaryOperation.Mul:
                return (leftValue * rightValue);
            case ir.BinaryOperation.Div:
                return (leftValue / rightValue);
            case ir.BinaryOperation.Mod:
                return (leftValue % rightValue);
            case ir.BinaryOperation.LessThan:
                return (leftValue < rightValue);
            case ir.BinaryOperation.GreaterThan:
                return (leftValue > rightValue);
            case ir.BinaryOperation.LessThanEqual:
                return (leftValue <= rightValue);
            case ir.BinaryOperation.GreaterThanEqual:
                return (leftValue >= rightValue);
            case ir.BinaryOperation.EqualEqual:
            case ir.BinaryOperation.EqualEqualEqual:
                return (leftValue == rightValue);
            case ir.BinaryOperation.NotEqual:
            case ir.BinaryOperation.NotEqualEqual:
                return (leftValue != rightValue);
            case ir.BinaryOperation.And:
                return (leftValue && rightValue);
            case ir.BinaryOperation.Or:
                return (leftValue || rightValue);
            default:
                throw new Error(`Not implemented or invalid binary operator`);
        }
    }

    evaluatePrefixUnaryNode(state: State<DataVariant>, node: ir.PrefixUnaryOperationVertex): Value {
        let value: any = this.evaluateDataNode(state, node.operand!);

        switch (node.operator) {
            case ir.UnaryOperation.Not:
                return (!value);
            case ir.UnaryOperation.Minus:
                return ((-1) * value);
            case ir.UnaryOperation.Plus:
                return value;
            default:
                throw new Error(`Not implemented or invalid prefix unary operator`);
        }
    }
    
}
