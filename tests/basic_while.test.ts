
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic while test', () => {
    const v0 = new ir.StartVertex();
    const v1 = new ir.LiteralVertex(4);
    const v2 = new ir.BranchVertex();
    const v3 = new ir.MergeVertex();
    const v4 = new ir.LiteralVertex(0);
    const v6 = new ir.LiteralVertex(1);
    const v9 = new ir.PhiVertex();
    const v5 = new ir.BinaryOperationVertex('>', v9, v4);
    const v7 = new ir.BinaryOperationVertex('-', v9, v6);
    const v8 = new ir.PassVertex();
    const v10 = new ir.ReturnVertex();

    v0.next = v3;
    v3.next = v2;
    v8.next = v3;
    v2.trueNext = v8;
    v2.falseNext = v10;
    v10.value = v9;
    v2.condition = v5;
    v9.addOperand({value: v7, srcBranch: v8});
    v9.addOperand({value: v1, srcBranch: v0});
    v9.merge = v3;

    const g = new ir.Graph([v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10], v0);
    test('Return value should be 0', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(0);
    });

    test('Return value should be 2', () => {
        v4.value = 2;
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(2);
    });
});
