
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic control flow test', () => {
    const v1 = new ir.StartVertex();
    const v2 = new ir.PassVertex();
    const v3 = new ir.PassVertex();
    const v4 = new ir.ReturnVertex();
    const v5 = new ir.LiteralVertex(42);

    v1.next = v2;
    v2.next = v3;
    v3.next = v4;
    v4.value = v5;

    const g = new ir.Graph([v1, v2, v3, v4, v5], v1);
    test('Return value should be 42', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(42);
    });
});
