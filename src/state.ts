import assert from 'assert';
import { Value, Vertex, VertexKind } from 'graphir';

export type VertexId = number;
export type Property = string;
export type ObjectFields = { [key: Property]: DataVariant }
export type DataVariant = Value | ObjectFields;

export class State {
    
    private _verticesValuesMap: { [key: VertexId]: DataVariant } = {};
    private _returnedValue: DataVariant = 0; // assumption: the program always returns a value

    setVertexData(vertex: Vertex, value: DataVariant) {
        assert(this.isStateful(vertex.kind));
        this._verticesValuesMap[vertex.id] = value;
    }

    getVertexData(vertex: Vertex): DataVariant {
        return this._verticesValuesMap[vertex.id] as DataVariant;
    }

    vertexExists(id: VertexId): boolean {
        return (id in this._verticesValuesMap);
    }

    setObjectField(id: VertexId, property: Property, fieldValue: DataVariant) {
        let objectFields: ObjectFields = this._verticesValuesMap[id] as ObjectFields;
        objectFields[property] = fieldValue;
    }

    getObjectField(id: VertexId, property: Property): DataVariant {
        let objectFields: ObjectFields = this._verticesValuesMap[id] as ObjectFields;
        return objectFields[property];
    }

    setReturnedValue(returnedValue: DataVariant) {
        this._returnedValue = returnedValue;
    }

    getReturnedValue(): DataVariant {
        return this._returnedValue;
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
}
