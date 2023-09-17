import assert from 'assert';
import * as ir from 'graphir';
import { State } from './state';
import { DebugLog } from './log';

export type Property = string;

export class GraphInterpreter<T> {
    private _statesStack: Array<State<T>> = [];
    public log: DebugLog;

    constructor(statesStack: Array<State<T>>) {
        this._statesStack = statesStack;
        this.log = new DebugLog();
    }

    public pushState(newState: State<T>) {
        this._statesStack.push(newState);
    }

    public popState() {
        this._statesStack.pop();
    }

    public getTopState() {
        return this._statesStack[this._statesStack.length - 1];
    }

    public cloneStatesStack(): Array<State<T>> {
        let clonedStack: Array<State<T>> = [];
        for (let state of this._statesStack) {
            clonedStack.push(state.clone());
        }
        return clonedStack;
    }

    /* EXECUTE */
    
    public executeControlNode(node: ir.ControlVertex, cameFrom: ir.ControlVertex): ir.ControlVertex | undefined {
        let state: State<T> = this.getTopState();
        
        switch (node.kind) {
            case ir.VertexKind.Start: 
            case ir.VertexKind.Pass:
                break;

            case ir.VertexKind.Allocation:
                state.setVertexData(node, {} as T);
                break;

            case ir.VertexKind.Store:
                this.executeStoreNode(state, node as ir.StoreVertex);
                break;

            case ir.VertexKind.Load:
                this.executeLoadNode(state, node as ir.LoadVertex);
                break;

            case ir.VertexKind.Branch:
                return this.executeBranchNode(state, node as ir.BranchVertex);

            case ir.VertexKind.Merge:
                this.executeMergeNode(state, node as ir.MergeVertex, cameFrom);
                break;

            case ir.VertexKind.Call:
                return this.executeCallNode(node as ir.CallVertex);

            case ir.VertexKind.Return:
                return this.executeReturnNode(node as ir.ReturnVertex);

            default:
                throw new Error(`Control node kind ${node.kind} invalid or not implemented`);
        }

        // return the next node
        if (node instanceof ir.NonTerminalControlVertex) {
            return node.next as ir.ControlVertex;
        }
        throw new Error(`Reached a vertex without next edge`);
    }

    private executeBranchNode(state: State<T>, node: ir.BranchVertex): ir.ControlVertex {
        let condition: ir.Value = this.evaluateDataNode(state, node.condition as ir.DataVertex) as ir.Value;
        if (condition == true) {
            return node.trueNext as ir.ControlVertex;
        }
        return node.falseNext as ir.ControlVertex;
    }

    private executeCallNode(node: ir.CallVertex): ir.ControlVertex {
        let currentState: State<T> = this.getTopState();
        let newState: State<T> = new State(node);

        // add the parameters values to the new state
        let args: Array<ir.DataVertex> | undefined = node.args;
        if (args !== undefined) {
            // assumption: the args list is sorted by the position
            for (var i in args) {
                let argValue: T = this.evaluateDataNode(currentState, args[i]);
                newState.addParameterData(argValue);
            }
        }
        this.pushState(newState);

        // the next control vertex is the start vertex of the callee
        let functionSymbol: ir.SymbolVertex = node.callee as ir.SymbolVertex;
        return functionSymbol.startVertex as ir.ControlVertex;
    }

    private executeReturnNode(node: ir.ReturnVertex): ir.ControlVertex | undefined {
        let terminatedState: State<T> = this.getTopState();
        let returnAddress: ir.CallVertex | undefined = terminatedState.getReturnAddress();
        let returnedValue: T | undefined;
        if (node.value !== undefined) {
            returnedValue = this.evaluateDataNode(terminatedState, node.value as ir.DataVertex);
        }

        if (returnAddress !== undefined) {
            // end of function scope
            this.popState();
            let state: State<T> = this.getTopState();

            // save the returned value as the call vertex's state
            if (returnedValue !== undefined) {
                state.setVertexData(returnAddress, returnedValue);
            }

            return returnAddress.next;
        }
        // end of global state
        if (returnedValue !== undefined) {
            this.setReturnedValue(returnedValue);
        }
        return undefined;
    }

    private executeMergeNode(state: State<T>, node: ir.MergeVertex, cameFrom: ir.ControlVertex) {
        // evaluate phi and set its value in the program state
        for (let phiNode of node.phiVertices) {
            let phiOperands: Array<ir.PhiOperand> = [];
            for (let edge of phiNode.outEdges) {
                if (edge instanceof ir.PhiEdge) {
                    phiOperands.push({ value: edge.target, srcBranch: (<ir.PhiEdge>edge).srcBranch } as ir.PhiOperand);
                }
            }
            for (let operand of phiOperands) {
                if (operand.srcBranch == cameFrom) {
                    let phiValue: T = this.evaluateDataNode(state, operand.value);
                    state.setVertexData(phiNode, phiValue);
                }
            }
        }
    }

    // virtual methods
    protected setReturnedValue(returnedValue: T) {
        assert(false, "setReturnedValue in base class not reachable, potentially a bug!");
    }

    protected executeLoadNode(state: State<T>, node: ir.LoadVertex) {
        assert(false, "executeLoadNode in base class not reachable, potentially a bug!");
    }

    protected executeStoreNode(state: State<T>, node: ir.StoreVertex) {
        assert(false, "executeStoreNode in base class not reachable, potentially a bug!");
    }

    /* EVALUATE */

    public evaluateDataNode(state: State<T>, node: ir.DataVertex): T {
        switch (node.kind) {
            case ir.VertexKind.Literal:
                return this.evaluateLiteralNode(node as ir.LiteralVertex);
    
            case ir.VertexKind.BinaryOperation:
                return this.evaluateBinaryNode(state, node as ir.BinaryOperationVertex);

            case ir.VertexKind.PrefixUnaryOperation:
                return this.evaluatePrefixUnaryNode(state, node as ir.PrefixUnaryOperationVertex);
    
            case ir.VertexKind.Allocation:
            case ir.VertexKind.Load:
            case ir.VertexKind.Phi:
            case ir.VertexKind.Call:
                assert(state.vertexExistsInMap(node.id), `${node.kind} vertex's value does not exist in the top state`);
                return state.getVertexData(node);
            
            case ir.VertexKind.Parameter:
                assert(state.parameterExist((<ir.ParameterVertex>node).position as number), `Parameter vertex's value does not exist in the top state`);
                return state.getParameterData(node as ir.ParameterVertex);
    
            default:
                throw new Error(`Data node kind ${node.kind} invalid or not implemented`);
        }
    }

    // virtual methods
    evaluateLiteralNode(node: ir.LiteralVertex): T {
        assert(false, "evaluateLiteralNode in base class not reachable, potentially a bug!");
        return new Object() as T;
    }

    evaluateBinaryNode(state: State<T>, node: ir.BinaryOperationVertex): T {
        assert(false, "evaluateBinaryNode in base class not reachable, potentially a bug!");
        return new Object() as T;
    }

    evaluatePrefixUnaryNode(state: State<T>, node: ir.PrefixUnaryOperationVertex): T {
        assert(false, "evaluatePrefixUnaryNode in base class not reachable, potentially a bug!");
        return new Object() as T;
    }
}
