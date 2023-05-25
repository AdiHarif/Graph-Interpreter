
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic object operations test', () => {
    const v1 = new ir.StartVertex();
    const v2 = new ir.AllocationVertex();
    const v3 = new ir.StoreVertex();
    const v4 = new ir.StoreVertex();
    const v5 = new ir.LoadVertex();
    const v6 = new ir.ReturnVertex();
    const v7 = new ir.LiteralVertex(42);
    const v8 = new ir.LiteralVertex(81);
    const v9 = new ir.LiteralVertex("field");

    v1.next = v2;
    v2.next = v3;
    v3.next = v4;
    v4.next = v5;
    v5.next = v6;

    v3.object = v4.object = v5.object = v2;
    v3.property = v4.property = v5.property = v9;
    v3.value = v7;
    v4.value = v8;
    v6.value = v5;

    const g = new ir.Graph([v1, v2, v3, v4, v5, v6, v7, v8, v9], v1);
    test('Return value should be 81', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(81);
    });
});
