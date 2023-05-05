import { Value } from 'graphir';

export class State {
    
    private _verticesValuesMap: Map<number, Value>;

    constructor() {
        this._verticesValuesMap = new Map<number, Value>();
    }

    setVertexValue(id: number, value: Value) {
        this._verticesValuesMap.set(id, value);
    }

    getVertexValue(id: number): Value {
        if (this._verticesValuesMap.has(id) == false) {
            throw new Error(`Vertex id ${id} value doesn't exist`);
        }
        return this._verticesValuesMap.get(id) as Value;
    }

    vertexValueExists(id: number): boolean {
        return (this._verticesValuesMap.has(id) == true);
    }
}
