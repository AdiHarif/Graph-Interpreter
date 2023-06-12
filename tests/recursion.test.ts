
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Recursion test', () => {

    const v0 = new ir.StartVertex();
    const v4 = new ir.StartVertex();
    const v1 = new ir.SymbolVertex('factorial', v4);
    var v3 = new ir.LiteralVertex(6);
    const v2 = new ir.CallVertex(v1, [v3]);
    const v5 = new ir.ParameterVertex(0);
    const v6 = new ir.LiteralVertex(2);
    const v7 = new ir.BinaryOperationVertex('<', v5, v6);
    const v8 = new ir.BranchVertex(); 
    const v9 = new ir.ReturnVertex();
    const v10 = new ir.ReturnVertex();
    const v11 = new ir.LiteralVertex(1);
    const v13 = new ir.BinaryOperationVertex('-', v5, v11);
    const v12 = new ir.CallVertex(v1, [v13]);
    const v14 = new ir.ReturnVertex();
    const v15 = new ir.BinaryOperationVertex('*', v5, v12);

    v0.next = v2;
    v4.next = v8;
    v8.condition = v7;
    v8.trueNext = v10;
    v8.falseNext = v12;
    v10.value = v11;
    v12.next = v14;
    v14.value = v15;
    v2.next = v9;
    v9.value = v2;

    const g = new ir.Graph([v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v14, v15], v0);
    test('Return value should be 720', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(720); // 6!
    });

    test('Return value should be 120', () => {
        v3.value = 5;
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(120); // 5!
    });
});
