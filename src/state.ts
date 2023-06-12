import assert from 'assert';
import { Value, Vertex, VertexKind, ParameterVertex, CallVertex } from 'graphir';

export type VertexId = number;
export type Property = string;
export type ObjectFields = { [key: Property]: DataVariant }
export type DataVariant = Value | ObjectFields;

export class State {
    
    // dictionary of (vertexId, value/object) for each stateful vertex in the state's scope
    private _verticesValuesMap: { [key: VertexId]: DataVariant } = {};

    // array of (possition, value/object) for each parameter
    private _functionParameters: Array<DataVariant> = [];

    // the call vertex that invoked the state's scope
    private _returnAddress: CallVertex | undefined = undefined;

    public constructor(returnAddress: CallVertex | undefined) {
        this._returnAddress = returnAddress;
    }

    setVertexData(vertex: Vertex, value: DataVariant) {
        assert(this.isStateful(vertex.kind));
        this._verticesValuesMap[vertex.id] = value;
    }

    getVertexData(vertex: Vertex): DataVariant {
        return this._verticesValuesMap[vertex.id] as DataVariant;
    }

    vertexExistsInMap(id: VertexId): boolean {
        return (id in this._verticesValuesMap);
    }

    addParameterData(value: DataVariant) {
        this._functionParameters.push(value);
    }

    getParameterData(param: ParameterVertex): DataVariant {
        return this._functionParameters[param.position as number] as DataVariant;
    }

    parameterExist(position: number): boolean {
        return (this._functionParameters.length > position);
    }

    getReturnAddress(): CallVertex | undefined {
        return this._returnAddress;
    }

    private isStateful(vertexKind: VertexKind): boolean {
        switch (vertexKind) {
            case VertexKind.Phi:
            case VertexKind.Allocation:
            case VertexKind.Load:
            case VertexKind.Call:
                return true;
            default:
                return false;
        }
    }

    peek(): Array<string> {
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
}
