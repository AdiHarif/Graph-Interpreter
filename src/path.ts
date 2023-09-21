import assert from 'assert';
import * as ir from 'graphir';
import * as z3 from 'z3-solver';
import { SymbolicInterpreter, SymbolicExpression } from "./symbolic_interpreter";
import { State, VertexId } from './state';

export class Path extends SymbolicInterpreter {
    // The remaining execution budget for the path
    private _fuel: number;

    // Used to sort the paths priority queue
    private _grade: number = 0;

    // The constraints that were collected on the path
    private _constraints: SymbolicExpression | undefined;

    // The number of times each node was visited in the path
    private _visitCount: { [key: VertexId]: number } = {};

    // The sequence of nodes that were visited in the path
    private _nodeSequence: Array<ir.ControlVertex> = [];

    constructor(statesStack: Array<State<SymbolicExpression>>, fuel: number, visitCount: { [key: VertexId]: number }, nodeSequence: Array<ir.ControlVertex>, grade: number, constraints?: SymbolicExpression) {
        super(statesStack);
        this._fuel = fuel;
        this._grade = grade;
        this._constraints = constraints;
        this._visitCount = visitCount;
        this._nodeSequence = nodeSequence;
    }

    public step(): number {
        this._fuel--;
        return this._fuel;
    }

    public addConstraint(constraint: SymbolicExpression) {
        if (this._constraints == undefined) {
            this._constraints = constraint;
        }
        else {
            this._constraints = (<z3.Bool>this._constraints).and((<z3.Bool>constraint));
        }
    }

    public get constraints(): SymbolicExpression | undefined {
        return this._constraints;
    }

    public get fuel(): number {
        return this._fuel;
    }

    public visitNode(node: ir.ControlVertex) {
        if (this._visitCount[node.id] == undefined) {
            this._visitCount[node.id] = 0;
        }
        this._visitCount[node.id]++;
        this._nodeSequence.push(node);
    }

    public getVisitCount(id: VertexId): number {
        if (id in this._visitCount) {
            return this._visitCount[id];
        }
        return 0;
    }

    public cloneVisitCount(): { [key: VertexId]: number } {
        let clonedVisitCount: { [key: VertexId]: number } = {};
        for (let vertexId in this._visitCount) {
            clonedVisitCount[vertexId] = this._visitCount[vertexId];
        }
        return clonedVisitCount;
    }

    public cloneNodeSequence(): Array<ir.ControlVertex> {
        let clonedNodeSequence: Array<ir.ControlVertex> = [];
        for (let node of this._nodeSequence) {
            clonedNodeSequence.push(node);
        }
        return clonedNodeSequence;
    }

    public get tail(): ir.ControlVertex {
        assert(this._nodeSequence.length > 0, "Path.getTail: nodeSequence is empty");
        return this._nodeSequence[this._nodeSequence.length - 1];
    }

    public get nodeBeforeTail(): ir.ControlVertex | undefined {
        if (this._nodeSequence.length < 2) {
            return undefined;
        }
        return this._nodeSequence[this._nodeSequence.length - 2];
    }

    public get nodeSequence(): Array<ir.ControlVertex> {
        return this._nodeSequence;
    }

    public get grade(): number {
        return this._grade;
    }
}

// the path with the lowest total global visit count (less traveled by vertices)
// will be the first path to be executed
export function comparePaths(path1: Path, path2: Path): number {
    // smaller grade wins
    return path1.grade - path2.grade;
}