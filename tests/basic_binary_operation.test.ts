
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic return value test', () => {
    const v1 = new ir.StartVertex();
    const v2 = new ir.ReturnVertex();
    const v3 = new ir.LiteralVertex(1);
    const v4 = new ir.LiteralVertex(2);
    const v5 = new ir.BinaryOperationVertex('+', v3, v4);

    v1.next = v2;
    v2.value = v5;

    const g = new ir.Graph([v1, v2, v3, v4, v5], v1);
    test('Return value should be 3', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(3);
    });

    test('Return value should be 5', () => {
        v3.value = 3;
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(5);
    });

    test('Return value should be 1', () => {
        v5.operator = '-';
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(1);
    });

    test('Return value should be 2', () => {
        v3.value = 4;
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(2);
    });
});
