
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Basic branch test', () => {

    const start = new ir.StartVertex();
    const alloc = new ir.AllocationVertex();
    const branch = new ir.BranchVertex();
    const cond = new ir.LiteralVertex(true);
    const storeTrue = new ir.StoreVertex();
    const storeFalse = new ir.StoreVertex();
    const merge = new ir.MergeVertex();
    const load = new ir.LoadVertex();
    const field = new ir.LiteralVertex("field");
    const ret = new ir.ReturnVertex();
    const trueVal = new ir.LiteralVertex(1);
    const falseVal = new ir.LiteralVertex(2);

    start.next = alloc;
    alloc.next = branch;
    branch.condition = cond;
    branch.trueNext = storeTrue;
    branch.falseNext = storeFalse;
    storeTrue.next = merge;
    storeFalse.next = merge;
    merge.next = load;
    load.next = ret;
    ret.value = load;
    storeFalse.object = storeTrue.object = load.object = alloc;
    storeFalse.property = storeTrue.property = load.property = field;
    storeTrue.value = trueVal;
    storeFalse.value = falseVal;

    const g = new ir.Graph([start, alloc, branch, cond, storeTrue, storeFalse, merge, load, field, ret, trueVal, falseVal], start);
    test('Return value should be 1', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(1);
    });

    test('Return value should be 2', () => {
        cond.value = false;
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(2);
    });
});
