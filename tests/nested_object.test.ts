
import * as ir from 'graphir';

import { executeGraph } from '../src/interpreter';

describe('Nested object test', () => {

    const start = new ir.StartVertex();
    const parent = new ir.AllocationVertex();
    const child = new ir.AllocationVertex();
    const storeChild = new ir.StoreVertex();
    const storeParent = new ir.StoreVertex();
    const loadChild = new ir.LoadVertex();
    const loadParent = new ir.LoadVertex();
    const ret = new ir.ReturnVertex();
    const fieldVal = new ir.LiteralVertex(42);
    const fieldProp = new ir.LiteralVertex('field');
    const childProp = new ir.LiteralVertex('child');

    start.next = parent;
    parent.next = child;
    child.next = storeChild;
    storeChild.next = storeParent;
    storeParent.next = loadParent;
    loadParent.next = loadChild;
    loadChild.next = ret;

    storeChild.value = fieldVal;
    storeChild.property = fieldProp;
    storeChild.object = child;

    storeParent.value = child;
    storeParent.property = childProp;
    storeParent.object = parent;

    loadParent.object = parent;
    loadParent.property = childProp;

    loadChild.object = loadParent;
    loadChild.property = fieldProp;

    ret.value = loadChild;

    const g = new ir.Graph([start, parent, child, storeChild, storeParent, loadParent, loadChild, ret, fieldVal, fieldProp, childProp], start);
    test('Return value should be 42', () => {
        const result = executeGraph(g);
        expect(result.returnValue()).toBe(42);
    });
});
