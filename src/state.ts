import assert from 'assert';
import * as ir from 'graphir';

export type VertexId = number;

export class State<T> {
    
    // dictionary of (vertexId, value/object) for each stateful vertex in the state's scope
    private _verticesValuesMap: { [key: VertexId]: T } = {};

    // array of (possition, value/object) for each parameter
    private _functionParameters: T[] = [];

    // the call vertex that invoked the state's scope
    private _returnAddress: ir.CallVertex | undefined = undefined;

    public constructor(returnAddress: ir.CallVertex | undefined) {
        this._returnAddress = returnAddress;
    }

    public setVertexData(vertex: ir.Vertex, value: T) {
        assert(this.isStateful(vertex.kind));
        this._verticesValuesMap[vertex.id] = value;
    }

    public getVertexData(vertex: ir.Vertex): T {
        return this._verticesValuesMap[vertex.id] as T;
    }

    public vertexExistsInMap(id: VertexId): boolean {
        return (id in this._verticesValuesMap);
    }

    public addParameterData(value: T) {
        this._functionParameters.push(value);
    }

    public getParameterData(param: ir.ParameterVertex): T {
        return this._functionParameters[param.position as number];
    }

    public parameterExist(position: number): boolean {
        return (this._functionParameters.length > position);
    }

    public getReturnAddress(): ir.CallVertex | undefined {
        return this._returnAddress;
    }

    public clone(): State<T> {
        let clone: State<T> = new State<T>(this._returnAddress);
        clone._verticesValuesMap = Object.assign({}, this._verticesValuesMap);
        clone._functionParameters = this._functionParameters.slice();
        return clone;
    }

    public peek(): Array<string> {
        let out: Array<string> = [];
        out.push(`/// Data Vertices ///\n`)
        for (let key in this._verticesValuesMap) {
            out.push(`vertex-${key} : ${this._verticesValuesMap[key]}\n`);
        }
        out.push(`/// Function Parameters ///\n`)
        for (let i = 0; i < this._functionParameters.length; i++) {
            out.push(`position-${i} : ${this._functionParameters[i]}\n`);
        }
        return out;
    }

    private isStateful(vertexKind: ir.VertexKind): boolean {
        switch (vertexKind) {
            case ir.VertexKind.Phi:
            case ir.VertexKind.Allocation:
            case ir.VertexKind.Load:
            case ir.VertexKind.Call:
            case ir.VertexKind.Literal: // only for symbolic variable!
                return true;
            default:
                return false;
        }
    }
}
