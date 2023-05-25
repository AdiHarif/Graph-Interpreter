
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic return value test', () => {
    const v1 = new ir.StartVertex();
    const v2 = new ir.ReturnVertex();
    const v3 = new ir.LiteralVertex(1);

    v1.next = v2;
    v2.value = v3;

    const g = new ir.Graph([v1, v2, v3], v1);
    test('Return value should be 1', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(1);
    });

    test('Return value should be 2', () => {
        v3.value = 2;
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(2);
    });
});
