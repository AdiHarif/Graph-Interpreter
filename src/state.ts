import assert from 'assert';
import { Value, Vertex, VertexKind } from 'graphir';

export class State {
    
    private _verticesValuesMap: Map<number, Value>;
    private _returnedValue: Value = 0; // assumption: the program always returns a value

    constructor() {
        this._verticesValuesMap = new Map<number, Value>();
    }

    setVertexValue(vertex: Vertex, value: Value) {
        assert(this.isStateful(vertex.kind));
        this._verticesValuesMap.set(vertex.id, value);
    }

    getVertexValue(vertex: Vertex): Value {
        assert(this.isStateful(vertex.kind));
        if (this._verticesValuesMap.has(vertex.id) == false) {
            throw new Error(`Vertex id ${vertex.id} value doesn't exist in the program state`);
        }
        return this._verticesValuesMap.get(vertex.id) as Value;
    }

    vertexValueExists(id: number): boolean {
        return (this._verticesValuesMap.has(id) == true);
    }

    setReturnedValue(returnedValue: Value) {
        this._returnedValue = returnedValue;
    }

    getReturnedValue(): Value {
        return this._returnedValue;
    }

    private isStateful(vertexKind: VertexKind): boolean {
        switch (vertexKind) {
            case VertexKind.Merge:
            case VertexKind.Allocation:
            case VertexKind.Load:
            case VertexKind.Call:
                return true;
            default:
                return false;
        }
    }
}
