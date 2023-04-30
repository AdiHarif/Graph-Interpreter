
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic return value test', () => {
    const v1 = new ir.StartVertex();
    const v2 = new ir.ReturnVertex();
    const v3 = new ir.LiteralVertex(1);
    const v4 = new ir.LiteralVertex(2);
    const v5 = new ir.LiteralVertex(3);
    const v6 = new ir.LiteralVertex(4);
    const v7 = new ir.BinaryOperationVertex('+', v3, v4);
    const v8 = new ir.BinaryOperationVertex('+', v5, v6);
    const v9 = new ir.BinaryOperationVertex('+', v7, v8);

    v1.next = v2;
    v2.value = v5;

    const g = new ir.Graph([v1, v2, v3, v4, v5, v6, v7, v8, v9], v1);
    test('Return value should be 10', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(10);
    });

    v9.operator = '-';
    test('Return value should be -4', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(-4);
    });


    v9.right = v3;
    test('Return value should be 2', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(2);
    });
});
