
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Object nonexistent field access', () => {
    const v1 = new ir.StartVertex();
    const v2 = new ir.AllocationVertex();
    const v3 = new ir.StoreVertex();
    const v4 = new ir.LoadVertex();
    const v5 = new ir.ReturnVertex();
    const v6 = new ir.LiteralVertex(15);
    const v7 = new ir.LiteralVertex("field");
    const v8 = new ir.LiteralVertex("doesn't exist in object");

    v1.next = v2;
    v2.next = v3;
    v3.next = v4;
    v4.next = v5;

    v3.object = v4.object = v2;
    v3.property = v7;
    v3.value = v6;
    v4.property = v8;
    v5.value = v4;

    const g = new ir.Graph([v1, v2, v3, v4, v5], v1);
    test('Return value should be undefined', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(undefined);
    });
});
