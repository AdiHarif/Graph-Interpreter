
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic phi test', () => {
    const v1 = new ir.StartVertex();
    const v2 = new ir.BranchVertex();
    const v3 = new ir.LiteralVertex(true);
    const v4 = new ir.PassVertex();
    const v5 = new ir.PassVertex();
    const v6 = new ir.MergeVertex();
    const v7 = new ir.PhiVertex();
    const v8 = new ir.ReturnVertex();
    const v9 = new ir.LiteralVertex(1);
    const v10 = new ir.LiteralVertex(2);

    v1.next = v2;
    v2.condition = v3;
    v2.trueNext = v4;
    v2.falseNext = v5;
    v4.next = v6;
    v5.next = v6;
    v6.next = v8;
    v6.branch = v2;
    v7.addOperand({value: v9, srcBranch: v4});
    v7.addOperand({value: v10, srcBranch: v5});
    v7.merge = v6;
    v8.value = v7;

    const g = new ir.Graph([v1, v2, v3, v4, v5, v6, v7, v8, v9, v10], v1);
    test('Return value should be 1', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(1);
    });

    test('Return value should be 2', () => {
        v3.value = false;
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(2);
    });
});
