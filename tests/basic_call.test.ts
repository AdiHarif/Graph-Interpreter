
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic call test', () => {

    const v1 = new ir.StartVertex();
    const v2 = new ir.AllocationVertex();
    const v3 = new ir.StoreVertex();
    const v4 = new ir.LiteralVertex(4);
    const v5 = new ir.LiteralVertex(7);
    const v6 = new ir.LiteralVertex(6);
    const v7 = new ir.LiteralVertex('field');
    const v8 = new ir.BinaryOperationVertex('*', v5, v4);
    const v11 = new ir.LoadVertex(); 
    const v13 = new ir.ReturnVertex();
    const v14 = new ir.StartVertex();
    const v9 = new ir.SymbolVertex('function', v14);
    const v10 = new ir.CallVertex(v9, [v2, v8]);
    const v12 = new ir.BinaryOperationVertex('+', v10, v11);
    const v15 = new ir.LoadVertex();
    const v16 = new ir.ParameterVertex(0);
    const v17 = new ir.ParameterVertex(1);
    const v18 = new ir.StoreVertex();
    const v19 = new ir.BinaryOperationVertex('-', v17, v15);
    const v20 = new ir.LiteralVertex(3);
    const v21 = new ir.BinaryOperationVertex('*', v20, v17);
    const v22 = new ir.ReturnVertex();

    v1.next = v2;
    v2.next = v3;
    v3.next = v10;
    v10.next = v11;
    v11.next = v13;
    v14.next = v15;
    v15.next = v18;
    v18.next = v22;
    v3.object = v11.object = v2;
    v3.value = v6;
    v3.property = v11.property = v15.property = v18.property = v7;
    v13.value = v12;
    v15.object = v18.object = v16;
    v18.value = v19;
    v22.value = v21;

    const g = new ir.Graph([v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22], v1);
    test('Return value should be 106', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(106); //(7*4*3)+(7*4-6)
    });
});
