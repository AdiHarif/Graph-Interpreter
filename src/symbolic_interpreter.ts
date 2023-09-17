import assert from 'assert';
import * as ir from 'graphir';
import * as z3 from 'z3-solver';
import { State } from './state';
import { GraphInterpreter } from './graph_interpreter';
import { z3Context } from './symbolicExecution';
import { Property } from './graph_interpreter';
import { RunTimeError } from './exceptions';

export type SymbolicObjectFields = { [key: Property]: SymbolicExpression }
export type SymbolicExpression = z3.Arith | z3.Bool | SymbolicObjectFields;

export class SymbolicInterpreter extends GraphInterpreter<SymbolicExpression> {
    protected setReturnedValue(returnedValue: SymbolicExpression) {}

    /* EXECUTE */

    protected executeStoreNode(state: State<SymbolicExpression>, node: ir.StoreVertex) {
        // get the object
        let object: SymbolicObjectFields = this.evaluateDataNode(state, node.object as ir.DataVertex) as SymbolicObjectFields;
    
        // get the property's name
        let propertyVertex: ir.LiteralVertex = node.property as ir.LiteralVertex;
        let property: Property = propertyVertex.value as string;
    
        // get the value
        let valueVertex: ir.DataVertex = node.value as ir.DataVertex;
        let value: SymbolicExpression = this.evaluateDataNode(state, valueVertex);
    
        // store the value in the field
        object[property] = value;
    }
    
    protected executeLoadNode(state: State<SymbolicExpression>, node: ir.LoadVertex) {
        // get the object
        let object: SymbolicObjectFields = this.evaluateDataNode(state, node.object as ir.DataVertex) as SymbolicObjectFields;
    
        // get the property's name
        let propertyVertex: ir.LiteralVertex = node.property as ir.LiteralVertex;
        let property: Property = propertyVertex.value as string;
    
        if (object[property] !== undefined) {
            // load the value of the field
            let value: SymbolicExpression = object[property];
    
            // save the value in the top state
            state.setVertexData(node, value);
        }
        else {
            throw new RunTimeError(`Property "${property}" doesn't exist in object`);
        }
    }

    /* EVALUATE */

    evaluateLiteralNode(node: ir.LiteralVertex): SymbolicExpression {
        switch (typeof node.value) {
            case 'number':
                const { Real } = z3Context;
                return Real.val(node.value);
            case 'boolean':
                const { Bool } = z3Context;
                return Bool.val(node.value);
            case 'string':
            default:
                assert(false, `Can't express Literal vertex ${node.id} with value type ${typeof node.value}`);
        }
    }
    
    evaluateBinaryNode(state: State<SymbolicExpression>, node: ir.BinaryOperationVertex): SymbolicExpression {
        let leftExpression: SymbolicExpression = this.evaluateDataNode(state, node.left!);
        let rightExpression: SymbolicExpression = this.evaluateDataNode(state, node.right!);
    
        try {
            switch (node.operator) {
                case ir.BinaryOperation.Add:
                    return ((<z3.Arith>leftExpression).add((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.Sub:
                    return ((<z3.Arith>leftExpression).sub((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.Mul:
                    return ((<z3.Arith>leftExpression).mul((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.Div:
                    return ((<z3.Arith>leftExpression).div((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.Mod:
                    return ((<z3.Arith>leftExpression).mod((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.LessThan:
                    return ((<z3.Arith>leftExpression).lt((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.GreaterThan:
                    return ((<z3.Arith>leftExpression).gt((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.LessThanEqual:
                    return ((<z3.Arith>leftExpression).le((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.GreaterThanEqual:
                    return ((<z3.Arith>leftExpression).ge((<z3.CoercibleToArith>rightExpression)));
                case ir.BinaryOperation.EqualEqual:
                case ir.BinaryOperation.EqualEqualEqual: 
                    return ((<z3.Arith>leftExpression).eq((<z3.CoercibleToExpr>rightExpression)));
                case ir.BinaryOperation.NotEqual:
                case ir.BinaryOperation.NotEqualEqual:
                    return ((<z3.Arith>leftExpression).neq((<z3.CoercibleToExpr>rightExpression)));
                case ir.BinaryOperation.And:
                    return ((<z3.Bool>leftExpression).and((<z3.Bool>rightExpression)));
                case ir.BinaryOperation.Or:
                    return ((<z3.Bool>leftExpression).or((<z3.Bool>rightExpression)));
                default:
                    throw new Error(`Not implemented or invalid binary operator`);
            }
        } catch(err) {
            console.log("Error in expressBinaryNode: " + err);
            throw err;
        }
    }

    evaluatePrefixUnaryNode(state: State<SymbolicExpression>, node: ir.PrefixUnaryOperationVertex): SymbolicExpression {
        let expression: SymbolicExpression = this.evaluateDataNode(state, node.operand!);

        try {
            switch (node.operator) {
                case ir.UnaryOperation.Not:
                    return ((<z3.Bool>expression).not());
                case ir.UnaryOperation.Minus:
                    return ((<z3.Arith>expression).neg());
                case ir.UnaryOperation.Plus:
                    return expression;
                default:
                    throw new Error(`Not implemented or invalid prefix unary operator`);
            }
        }
        catch(err) {
            console.log("Error in expressPrefixUnaryNode: " + err);
            throw err;
        }
    }
}
