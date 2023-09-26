import * as ir from 'graphir';
import { Bug } from './bug';
import * as ge from '../../TS-Graph-Extractor'
import { symbolicExecuteGraph } from './symbolicExecution';
import { SymbolicExpression } from './symbolic_interpreter';

let terminateAfterFirstBug: boolean = true;
let decisionMetricString: string = "random";
let defaultTimeout: number = 5;

type AsyncTest = () => Promise<void>;

class AsyncUnitTest {
    private name: string = "";
    private test: AsyncTest;
    private bugsList: Array<Bug> = [];
    private symbols: Array<SymbolicExpression> = [];

    constructor(name: string, test: AsyncTest) {
        this.name = name;
        this.test = test;
    }

    async runTest() {
        console.log(`Run test: ${this.name}`);
        await this.test();
    }
}

function getTimeFromArgs(args: string[]): number | undefined {
    for (const arg of args) {
        // Check if the argument starts with '--time='
        if (arg.startsWith('--time=')) {
            // Extract the time value and convert it to a number
            const timeStr = arg.split('=')[1];
            const time = parseInt(timeStr);

            if (!isNaN(time)) {
                return time;
            }
        }
    }
    return undefined;
}

async function testEquationWithSolution(): Promise<void> {
    // symbolic values: x, y, z
    // if (3x + 2y - z == 1)
    //     if (2x - 2y + 4z == -2)
    //         if (x + y + z == 222)
    //             assert(false);
    // return;
    // ** the equation system has a solution if and only if the assert is reachable **
    
    const v1 = new ir.StartVertex();
    const globalRet = new ir.ReturnVertex();

    // entry point
    const v2 = new ir.StartVertex();
    const ep = new ir.SymbolVertex('entry point', v2);
    // the function's parameters (symbolic values) specify their types
    const d0 = new ir.LiteralVertex(0);
    const d1 = new ir.LiteralVertex(0);
    const d2 = new ir.LiteralVertex(0);
    // parameters - the symbols
    const x = new ir.ParameterVertex(0); // symbolic 0
    const y = new ir.ParameterVertex(1); // symbolic 1
    const z = new ir.ParameterVertex(2); // symbolic 2
    const v7 = new ir.CallVertex(ep, [d0, d1, d2]);
    v1.next = v7;
    v7.next = globalRet; // not reachable

    // end point - reachable if the assert is not hit
    const ret = new ir.ReturnVertex();

    // assert
    const dummy = new ir.StartVertex(); // assert call start vertex - not reachable
    const v9 = new ir.SymbolVertex('assert', dummy);
    const v10 = new ir.LiteralVertex(false); // condition
    const v11 = new ir.CallVertex(v9, [v10]);
    v11.next = ret; // not reachable - in this program only! if you wish to continue after the first assert, you need to assign a next vertex to the call
    dummy.next = ret;

    // 3x + 2y - z = 1
    const l1 = new ir.LiteralVertex(1);
    const l2 = new ir.LiteralVertex(2);
    const l3 = new ir.LiteralVertex(3);
    const m1 = new ir.BinaryOperationVertex('*', l3, x);
    const m2 = new ir.BinaryOperationVertex('*', l2, y);
    const m3 = new ir.BinaryOperationVertex('+', m1, m2);
    const m4 = new ir.BinaryOperationVertex('-', m3, z);
    const cond1 = new ir.BinaryOperationVertex('==', m4, l1);

    const b1 = new ir.BranchVertex();
    b1.condition = cond1;
    b1.falseNext = ret;
    v2.next = b1;

    // 2x - 2y + 4z = -2
    const l4 = new ir.LiteralVertex(4);
    const l5 = new ir.LiteralVertex(-2);
    const m5 = new ir.BinaryOperationVertex('*', l2, x);
    const m6 = new ir.BinaryOperationVertex('*', l2, y);
    const m7 = new ir.BinaryOperationVertex('-', m5, m6);
    const m8 = new ir.BinaryOperationVertex('*', l4, z);
    const m9 = new ir.BinaryOperationVertex('+', m7, m8);
    const cond2 = new ir.BinaryOperationVertex('==', m9, l5);

    const b2 = new ir.BranchVertex();
    b2.condition = cond2;
    b1.trueNext = b2;
    b2.falseNext = ret;

    // x + y + z = 222
    const l6 = new ir.LiteralVertex(222);
    const m10 = new ir.BinaryOperationVertex('+', x, y);
    const m11 = new ir.BinaryOperationVertex('+', m10, z);
    const cond3 = new ir.BinaryOperationVertex('==', m11, l6);

    const b3 = new ir.BranchVertex();
    b3.condition = cond3;
    b2.trueNext = b3;
    b3.falseNext = ret;
    b3.trueNext = v11; // assert

    const g = new ir.Graph([v1, v2, ep, d0, d1, d2, x, y, z, v7, globalRet, ret, dummy, v9, v10, v11, l1, l2, l3, l4, l5, l6, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, cond1, cond2, cond3, b1, b2, b3], v1);
    await symbolicExecuteGraph(g, 'entry point', terminateAfterFirstBug, decisionMetricString, defaultTimeout);
}

async function testEquationWithoutSolution(): Promise<void> {
    // symbolic values: x, y, z
    // if (2x + y + z == 5)
    //     if (2x + y + z == 4)
    //         if (-x + 4y - 3z == 9)
    //             assert(false);
    // return;
    // ** the equation system has a solution if and only if the assert is reachable **
    
    const v1 = new ir.StartVertex();
    const globalRet = new ir.ReturnVertex();

    // entry point
    const v2 = new ir.StartVertex();
    const ep = new ir.SymbolVertex('entry point', v2);
    // the function's parameters (symbolic values) specify their types
    const d0 = new ir.LiteralVertex(0);
    const d1 = new ir.LiteralVertex(0);
    const d2 = new ir.LiteralVertex(0);
    // parameters - the symbols
    const x = new ir.ParameterVertex(0); // symbolic 0
    const y = new ir.ParameterVertex(1); // symbolic 1
    const z = new ir.ParameterVertex(2); // symbolic 2
    const v7 = new ir.CallVertex(ep, [d0, d1, d2]);
    v1.next = v7;
    v7.next = globalRet; // not reachable

    // end point - reachable if the assert is not hit
    const ret = new ir.ReturnVertex();

    // assert
    const dummy = new ir.StartVertex(); // assert call start vertex - not reachable
    const v9 = new ir.SymbolVertex('assert', dummy);
    const v10 = new ir.LiteralVertex(false); // condition
    const v11 = new ir.CallVertex(v9, [v10]);
    v11.next = ret; // not reachable - in this program only! if you wish to continue after the first assert, you need to assign a next vertex to the call
    dummy.next = ret;

    // 2x + y + z = 5
    const l5 = new ir.LiteralVertex(5);
    const l2 = new ir.LiteralVertex(2);
    const m1 = new ir.BinaryOperationVertex('*', l2, x);
    const m2 = new ir.BinaryOperationVertex('+', m1, y);
    const m3 = new ir.BinaryOperationVertex('+', m2, z);
    const cond1 = new ir.BinaryOperationVertex('==', m3, l5);

    const b1 = new ir.BranchVertex();
    b1.condition = cond1;
    b1.falseNext = ret;
    v2.next = b1;

    // 2x + y + z = 4
    const l4 = new ir.LiteralVertex(4);
    const m4 = new ir.BinaryOperationVertex('*', l2, x);
    const m5 = new ir.BinaryOperationVertex('+', m4, y);
    const m6 = new ir.BinaryOperationVertex('+', m5, z);
    const cond2 = new ir.BinaryOperationVertex('==', m6, l4);

    const b2 = new ir.BranchVertex();
    b2.condition = cond2;
    b1.trueNext = b2;
    b2.falseNext = ret;

    // -x + 4y - 3z = 9
    const l9 = new ir.LiteralVertex(9);
    const l3 = new ir.LiteralVertex(3);
    const m7 = new ir.BinaryOperationVertex('*', l4, y);
    const m8 = new ir.BinaryOperationVertex('*', l3, z);
    const m9 = new ir.BinaryOperationVertex('-', m7, m8);
    const m10 = new ir.BinaryOperationVertex('-', m9, x);
    const cond3 = new ir.BinaryOperationVertex('==', m10, l9);

    const b3 = new ir.BranchVertex();
    b3.condition = cond3;
    b2.trueNext = b3;
    b3.falseNext = ret;
    b3.trueNext = v11; // assert

    const g = new ir.Graph([v1, globalRet, v2, ep, d0, d1, d2, x, y, z, v7, ret, dummy, v9, v10, v11, l5, l2, m1, m2, m3, cond1, b1, l4, m4, m5, m6, cond2, b2, l9, l3, m7, m8, m9, m10, cond3, b3], v1);
    await symbolicExecuteGraph(g, 'entry point', terminateAfterFirstBug, decisionMetricString, defaultTimeout);
}

async function testMergeAndPhi(): Promise<void> {
    // symbolic values: a, b, c
    // let x=0, y=0, z=0;
    // if(a) {
    //     x = -2;
    // }
    // if (b < 5) {
    //     if (!a && c) {
    //         y = 1;
    //     }
    //     z = 2;
    // }
    // assert(x + y + z != 3);

    const v1 = new ir.StartVertex();
    const globalRet = new ir.ReturnVertex();

    // entry point
    const v2 = new ir.StartVertex();
    const ep = new ir.SymbolVertex('entry point', v2);
    // the function's parameters (symbolic values) specify their types
    const d0 = new ir.LiteralVertex(true);
    const d1 = new ir.LiteralVertex(0);
    const d2 = new ir.LiteralVertex(true);
    // parameters - the symbols
    const a = new ir.ParameterVertex(0); // symbolic 0
    const b = new ir.ParameterVertex(1); // symbolic 1
    const c = new ir.ParameterVertex(2); // symbolic 2
    const v3 = new ir.CallVertex(ep, [d0, d1, d2]);
    v1.next = v3;
    v3.next = globalRet; // not reachable

    // end point - reachable if the assert is not hit
    const ret = new ir.ReturnVertex();

    // if(a) {
    //     x = -2;
    // }
    const v4 = new ir.BranchVertex();
    v4.condition = a;
    v2.next = v4;
    const v5 = new ir.PassVertex();
    const v6 = new ir.PassVertex();
    v4.trueNext = v5;
    v4.falseNext = v6;
    const v7 = new ir.MergeVertex();
    v7.branch = v4;
    v5.next = v7;
    v6.next = v7;
    const v8 = new ir.PhiVertex(); // x
    const v12 = new ir.LiteralVertex(-2);
    const v13 = new ir.LiteralVertex(0);
    v8.addOperand({value: v12, srcBranch: v5});
    v8.addOperand({value: v13, srcBranch: v6});
    v8.merge = v7;

    // if (b < 5) {
    //     if (!a && c) {
    //         y = 1;
    //     }
    //     z = 2;
    // }

    const v14 = new ir.BranchVertex();
    const v15 = new ir.LiteralVertex(5);
    const v16 = new ir.BinaryOperationVertex('<', b, v15);
    v14.condition = v16;
    v7.next = v14;

    const v17 = new ir.BranchVertex();
    v14.trueNext = v17;
    const v18 = new ir.PrefixUnaryOperationVertex('!', a);
    const v19 = new ir.BinaryOperationVertex('&&', v18, c);
    v17.condition = v19;
    const v20 = new ir.PassVertex();
    const v21 = new ir.PassVertex();
    v17.trueNext = v20;
    v17.falseNext = v21;
    const v22 = new ir.MergeVertex();
    v22.branch = v17;
    v20.next = v22;
    v21.next = v22;
    const v23 = new ir.PhiVertex();
    const v24 = new ir.LiteralVertex(1);
    const v25 = new ir.LiteralVertex(0);
    v23.addOperand({value: v24, srcBranch: v20});
    v23.addOperand({value: v25, srcBranch: v21});
    v23.merge = v22;

    const v26 = new ir.PassVertex();
    v14.falseNext = v26;
    const v27 = new ir.MergeVertex();
    v27.branch = v14;
    v26.next = v27;
    v22.next = v27;
    const v28 = new ir.PhiVertex(); // z
    const v29 = new ir.LiteralVertex(2);
    const v30 = new ir.LiteralVertex(0);
    v28.addOperand({value: v29, srcBranch: v22});
    v28.addOperand({value: v30, srcBranch: v26});
    v28.merge = v27;
    const v31 = new ir.PhiVertex(); // y
    v31.addOperand({value: v23, srcBranch: v22});
    v31.addOperand({value: v25, srcBranch: v26});
    v31.merge = v27;
    
    // assert(x + y + z != 3);

    const v32 = new ir.BinaryOperationVertex('+', v8, v31);
    const v33 = new ir.BinaryOperationVertex('+', v32, v28);
    const v34 = new ir.LiteralVertex(3);
    const v35 = new ir.BinaryOperationVertex('!=', v33, v34); // condition

    // assert
    const dummy = new ir.StartVertex(); // assert call start vertex - not reachable
    const v9 = new ir.SymbolVertex('assert', dummy);
    const v11 = new ir.CallVertex(v9, [v35]);
    v11.next = ret; // not reachable - in this program only! if you wish to continue after the first assert, you need to assign a next vertex to the call
    dummy.next = ret;
    v27.next = v11;

    const g = new ir.Graph([globalRet, ep, d0, d1, d2, a, b, c, ret, dummy, v1, v2, v3, v4, v5, v6, v7, v8, v9, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, v26, v27, v28, v29, v30, v31, v32, v33, v34, v35], v1);
    await symbolicExecuteGraph(g, 'entry point', terminateAfterFirstBug, decisionMetricString, defaultTimeout);
}

async function testCallWithReturnValue(): Promise<void> {
    // symbolic values: x
    // let y = powerOfTwo(x);
    // assert(y < 1000);
    //
    // powerOfTwo(exp) {
    //     let p = 1;
    //     for (let i = 0; i < exp; i++) {
    //       p = p * 2;
    //     }
    //     return p;
    // }
    // ** There is a bug only when x >= 10 **

    const v1 = new ir.StartVertex();
    const globalRet = new ir.ReturnVertex();

    // entry point
    const v2 = new ir.StartVertex();
    const ep = new ir.SymbolVertex('entry point', v2);
    // the function's parameters (symbolic values) specify their types
    const d0 = new ir.LiteralVertex(0);
    // parameters - the symbols
    const x = new ir.ParameterVertex(0); // symbolic 0
    const v3 = new ir.CallVertex(ep, [d0]);
    v1.next = v3;
    v3.next = globalRet; // not reachable

    // end point - reachable if the assert is not hit
    const ret = new ir.ReturnVertex();

    // powerOfTwo(exp) {
    //     let p = 1;
    //     for (let i = 0; i < exp; i++) {
    //       p = p * 2;
    //     }
    //     return p;
    // }

    const v4 = new ir.StartVertex();
    const v5 = new ir.MergeVertex();
    v4.next = v5;
    const v6 = new ir.BranchVertex(); // while
    v5.branch = v6;
    v5.next = v6;
    const v7 = new ir.PhiVertex(); // i
    v7.merge = v5;
    const v8 = new ir.LiteralVertex(0);
    const v9 = new ir.LiteralVertex(1);
    const v10 = new ir.BinaryOperationVertex('+', v7, v9);
    const v11 = new ir.PassVertex();
    v11.next = v5;
    const v12 = new ir.ReturnVertex();
    v7.addOperand({value: v8, srcBranch: v4});
    v7.addOperand({value: v10, srcBranch: v11});
    const v13 = new ir.ParameterVertex(0);
    const v14 = new ir.BinaryOperationVertex('<', v7, v13);
    v6.condition = v14;
    v6.trueNext = v11;
    v6.falseNext = v12;
    const v15 = new ir.PhiVertex();
    const v16 = new ir.LiteralVertex(1);
    const v17 = new ir.LiteralVertex(2);
    const v18 = new ir.BinaryOperationVertex('*', v17, v15);
    v15.addOperand({value: v16, srcBranch: v4});
    v15.addOperand({value: v18, srcBranch: v11});
    v15.merge = v5;
    v12.value = v15;

    // let y = powerOfTwo(x);
    // assert(y < 1000);

    const v19 = new ir.SymbolVertex('powerOfTwo', v4);
    const v20 = new ir.CallVertex(v19, [x]);
    v2.next = v20;
    const v21 = new ir.LiteralVertex(1000);
    const v22 = new ir.BinaryOperationVertex('<', v20, v21); // assert condition

    // assert
    const dummy = new ir.StartVertex(); // assert call start vertex - not reachable
    const v23 = new ir.SymbolVertex('assert', dummy);
    const v24 = new ir.CallVertex(v23, [v22]);
    v24.next = ret; // not reachable - in this program only! if you wish to continue after the first assert, you need to assign a next vertex to the call
    dummy.next = ret;
    v20.next = v24;

    const g = new ir.Graph([globalRet, ep, d0, x, ret, dummy, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24], v1);
    await symbolicExecuteGraph(g, 'entry point', terminateAfterFirstBug, decisionMetricString, defaultTimeout);
}

async function testLoadAndStore(): Promise<void> {
    // How many products can you buy with 18 dollars?
    // symbolic values: q (quantity)
    // let product = { tag: 1234, price: 3.5 };
    // let total = 0;
    // for (let i = 0; i < q; i++) {
    //     total += product.price;
    // }
    // assert(total < 18);
    // ** There is a bug only when q >= 6 **

    const v1 = new ir.StartVertex();
    const globalRet = new ir.ReturnVertex();

    // entry point
    const v2 = new ir.StartVertex();
    const ep = new ir.SymbolVertex('entry point', v2);
    // the function's parameters (symbolic values) specify their types
    const d0 = new ir.LiteralVertex(0); // q
    // parameters - the symbols
    const q = new ir.ParameterVertex(0); // symbolic 0
    const v3 = new ir.CallVertex(ep, [d0]);
    v1.next = v3;
    v3.next = globalRet; // not reachable

    // end point - reachable if the assert is not hit
    const ret = new ir.ReturnVertex();

    // let product = { tag: 1234, price: 3.5 };
    const v4 = new ir.AllocationVertex();
    v2.next = v4;
    const v5 = new ir.StoreVertex();
    const v6 = new ir.LiteralVertex("tag");
    const v7 = new ir.LiteralVertex(1234);
    v5.property = v6;
    v5.value = v7;
    v5.object = v4;
    v4.next = v5;
    const v8 = new ir.StoreVertex();
    const v9 = new ir.LiteralVertex("price");
    const v10 = new ir.LiteralVertex(3.5);
    v8.property = v9;
    v8.value = v10;
    v8.object = v4;
    v5.next = v8;

    // let total = 0;
    // for (let i = 0; i < q; i++) {
    //     total += product.price;
    // }

    const v11 = new ir.MergeVertex();
    v8.next = v11;
    const v12 = new ir.PhiVertex(); // i
    const v13 = new ir.LiteralVertex(0);
    const v14 = new ir.LiteralVertex(1);
    const v15 = new ir.BinaryOperationVertex('+', v12, v14);
    const v16 = new ir.LoadVertex();
    v12.addOperand({value: v13, srcBranch: v8});
    v12.addOperand({value: v15, srcBranch: v16});
    v12.merge = v11;
    v16.property = v9;
    v16.object = v4;
    const v17 = new ir.PhiVertex(); // total
    const v18 = new ir.LiteralVertex(0);
    const v19 = new ir.BinaryOperationVertex('+', v17, v16);
    v17.addOperand({value: v18, srcBranch: v8});
    v17.addOperand({value: v19, srcBranch: v16});
    v17.merge = v11;
    v16.next = v11;
    const v20 = new ir.BranchVertex(); // while
    v11.branch = v20;
    v11.next = v20;
    v20.trueNext = v16;
    const v21 = new ir.BinaryOperationVertex('<', v12, q);
    v20.condition = v21;

    // assert(total < 18);

    const v22 = new ir.LiteralVertex(18);
    const v23 = new ir.BinaryOperationVertex('<', v17, v22); // assert condition

    // assert
    const dummy = new ir.StartVertex(); // assert call start vertex - not reachable
    const v24 = new ir.SymbolVertex('assert', dummy);
    const v25 = new ir.CallVertex(v24, [v23]);
    v25.next = ret; // not reachable - in this program only! if you wish to continue after the first assert, you need to assign a next vertex to the call
    dummy.next = ret;
    v20.falseNext = v25;

    const g = new ir.Graph([globalRet, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, ep, d0, q, ret, dummy], v1);
    await symbolicExecuteGraph(g, 'entry point', terminateAfterFirstBug, decisionMetricString, defaultTimeout);
}

async function testLongMixedCode(): Promise<void> {
    // Symbolic values: a, b, c, d
    // function entryPoint(a, b, c, d) {
    //     let newCar = { price: 1000, discount: 0.1 };
    //     let usedCar = { price: 500, discount: 0.2*d };
    //     if (!isEven(getDiscountPrice(usedCar)) && a + c > 0) {
    //         setDiscount(newCar, a);
    //     }
    //     let change = 0;
    //     if (b || c > 1050) {
    //         if (getDiscountPrice(usedCar) > getDiscountPrice(newCar) && (b  && a < c)) {
    //             change = buyProduct(usedCar, c);
    //             assert(change + 12 >= 0);
    //         } else {
    //             change = buyProduct(newCar, c);
    //             assert(change + 7 >= 0);
    //         }
    //     }
    //     return change;
    // }
    // 
    // function isEven(x) {
    //     return x % 2 == 0;
    // }
    //
    // function setDiscount(product, discount) {
    //     assert(discount >= 0 && discount <= 1);
    //     product.discount = discount;
    // }
    // 
    // function getDiscountPrice(product) {
    //     if (product.discount > 0) {
    //         return product.price * (1 - product.discount);
    //     }
    //     return product.price;
    // }
    //
    // function buyProduct(product, money) {
    //     let price = getDiscountPrice(product);
    //     assert(money >= price || money < 950);
    //     return money - price;
    // }

    const v1 = new ir.StartVertex();
    const globalRet = new ir.ReturnVertex();

    // entry point
    const v2 = new ir.StartVertex();
    const ep = new ir.SymbolVertex('entry point', v2);
    // the function's parameters (symbolic values) specify their types
    const d0 = new ir.LiteralVertex(0); // a
    const d1 = new ir.LiteralVertex(true); // b
    const d2 = new ir.LiteralVertex(0); // c
    const d3 = new ir.LiteralVertex(0); // d
    // parameters - the symbols
    const a = new ir.ParameterVertex(0); // symbolic 0
    const b = new ir.ParameterVertex(1); // symbolic 1
    const c = new ir.ParameterVertex(2); // symbolic 2
    const d = new ir.ParameterVertex(3); // symbolic 3
    const v3 = new ir.CallVertex(ep, [d0, d1, d2, d3]);
    v1.next = v3;
    v3.next = globalRet; // not reachable

    const v21 = new ir.StartVertex(); // assert call start vertex - not reachable
    const v22 = new ir.SymbolVertex('assert', v21);
    const ret = new ir.ReturnVertex(); // not reachable
    v21.next = ret;

    // function isEven(x) {
    //     return x % 2 == 0;
    // }
    const v4 = new ir.StartVertex();
    const v5 = new ir.SymbolVertex('isEven', v4);
    const v6 = new ir.ParameterVertex(0);
    const v7 = new ir.LiteralVertex(2);
    const v8 = new ir.BinaryOperationVertex('%', v6, v7);
    const v9 = new ir.LiteralVertex(0);
    const v10 = new ir.BinaryOperationVertex('==', v8, v9);
    const v11 = new ir.ReturnVertex();
    v4.next = v11;
    v11.value = v10;

    // function setDiscount(product, discount) {
    //     assert(discount >= 0 && discount <= 1);
    //     product.discount = discount;
    // }
    const v12 = new ir.StartVertex();
    const v13 = new ir.SymbolVertex('setDiscount', v12);
    const v14 = new ir.ParameterVertex(0);
    const v15 = new ir.ParameterVertex(1);
    const v16 = new ir.LiteralVertex(0);
    const v17 = new ir.BinaryOperationVertex('>=', v15, v16);
    const v18 = new ir.LiteralVertex(1);
    const v19 = new ir.BinaryOperationVertex('<=', v15, v18);
    const v20 = new ir.BinaryOperationVertex('&&', v17, v19);
    const v23 = new ir.CallVertex(v22, [v20]);
    v12.next = v23;
    const v24 = new ir.LiteralVertex("discount");
    const v25 = new ir.StoreVertex();
    v25.object = v14;
    v25.property = v24;
    v25.value = v15;
    v23.next = v25;
    const v26 = new ir.ReturnVertex();
    v25.next = v26;

    // function getDiscountPrice(product) {
    //     if (product.discount > 0) {
    //         return product.price * (1 - product.discount);
    //     }
    //     return product.price;
    // }
    const v27 = new ir.StartVertex();
    const v28 = new ir.SymbolVertex('getDiscountPrice', v27);
    const v29 = new ir.ParameterVertex(0);
    const v30 = new ir.LiteralVertex("discount");
    const v31 = new ir.LoadVertex(); // product.discount
    v31.object = v29;
    v31.property = v30;
    v27.next = v31;
    const v32 = new ir.LiteralVertex(0);
    const v33 = new ir.BinaryOperationVertex('>', v31, v32);
    const v34 = new ir.BranchVertex();
    v34.condition = v33;
    const v35 = new ir.LiteralVertex("price");
    const v36 = new ir.LoadVertex(); // product.price
    v31.next = v36;
    v36.object = v29;
    v36.property = v35;
    v36.next = v34;
    const v37 = new ir.LiteralVertex(1);
    const v38 = new ir.BinaryOperationVertex('-', v37, v31);
    const v39 = new ir.BinaryOperationVertex('*', v36, v38);
    const v40 = new ir.PhiVertex();
    const v41 = new ir.PassVertex();
    v34.trueNext = v41;
    const v42 = new ir.PassVertex();
    v34.falseNext = v42;
    const v43 = new ir.MergeVertex();
    v43.branch = v34;
    v41.next = v43;
    v42.next = v43;
    v40.addOperand({value: v39, srcBranch: v41});
    v40.addOperand({value: v36, srcBranch: v42});
    v40.merge = v43;
    const v44 = new ir.ReturnVertex();
    v43.next = v44;
    v44.value = v40;

    // function buyProduct(product, money) {
    //     let price = getDiscountPrice(product);
    //     assert(money >= price || money < 950);
    //     return money - price;
    // }
    
    const v86 = new ir.StartVertex();
    const v87 = new ir.SymbolVertex('buyProduct', v86);
    const v88 = new ir.ParameterVertex(0);
    const v45 = new ir.ParameterVertex(1);
    const v46 = new ir.CallVertex(v28, [v88]); // price
    v86.next = v46;
    const v47 = new ir.BinaryOperationVertex('>=', v45, v46);
    const v103 = new ir.LiteralVertex(950);
    const v104 = new ir.BinaryOperationVertex('<', v45, v103);
    const v105 = new ir.BinaryOperationVertex('||', v47, v104);
    const v48 = new ir.CallVertex(v22, [v105]);
    v46.next = v48;
    const v49 = new ir.BinaryOperationVertex('-', v45, v46);
    const v50 = new ir.ReturnVertex();
    v50.value = v49;
    v48.next = v50;

    //     let newCar = { price: 1000, discount: 0.1 };
    //     let usedCar = { price: 500, discount: 0.2*d };

    const v51 = new ir.AllocationVertex(); // newCar
    v2.next = v51;
    const v52 = new ir.LiteralVertex("price");
    const v53 = new ir.LiteralVertex(1000);
    const v54 = new ir.StoreVertex();
    v51.next = v54;
    v54.object = v51;
    v54.property = v52;
    v54.value = v53;
    const v55 = new ir.LiteralVertex("discount");
    const v56 = new ir.LiteralVertex(0.1);
    const v57 = new ir.StoreVertex();
    v57.object = v51;
    v57.property = v55;
    v57.value = v56;
    v54.next = v57;
    const v58 = new ir.AllocationVertex(); // usedCar
    v57.next = v58;
    const v59 = new ir.LiteralVertex(500);
    const v60 = new ir.StoreVertex();
    v60.object = v58;
    v60.property = v52;
    v60.value = v59;
    v58.next = v60;
    const v61 = new ir.LiteralVertex(0.2);
    const v98 = new ir.BinaryOperationVertex('*', v61, d);
    const v62 = new ir.StoreVertex();
    v62.object = v58;
    v62.property = v55;
    v62.value = v98;
    v60.next = v62;
    
    //     if (!isEven(getDiscountPrice(usedCar)) && a + c > 0) {
    //         setDiscount(newCar, a);
    //     }

    const v63 = new ir.CallVertex(v28, [v58]);
    v62.next = v63;
    const v64 = new ir.CallVertex(v5, [v63]);
    v63.next = v64;
    const v65 = new ir.PrefixUnaryOperationVertex('!', v64);
    const v89 = new ir.BinaryOperationVertex('+', a, c);
    const v90 = new ir.LiteralVertex(0);
    const v91 = new ir.BinaryOperationVertex('>', v89, v90);
    const v92 = new ir.BinaryOperationVertex('&&', v65, v91);
    const v66 = new ir.BranchVertex();
    v64.next = v66;
    v66.condition = v92;
    const v67 = new ir.CallVertex(v13, [v51, a]);
    v66.trueNext = v67;

    //     let change = 0;
    //     if (b || c > 1050) {
    //         if (getDiscountPrice(usedCar) > getDiscountPrice(newCar) && (b  && a < c)) {
    //             change = buyProduct(usedCar, c);
    //             assert(change + 12 >= 0);
    //         } else {
    //             change = buyProduct(newCar, c);
    //             assert(change + 7 >= 0);
    //         }
    //     }
    //     return change;

    const v93 = new ir.LiteralVertex(1050);
    const v94 = new ir.BinaryOperationVertex('>', c, v93);
    const v95 = new ir.BinaryOperationVertex('||', b, v94);
    const v68 = new ir.BranchVertex();
    v68.condition = v95;
    v67.next = v68;
    v66.falseNext = v68;
    const v69 = new ir.CallVertex(v28, [v58]);
    const v70 = new ir.CallVertex(v28, [v51]);
    const v71 = new ir.BinaryOperationVertex('>', v69, v70);
    const v96 = new ir.BinaryOperationVertex('<', a, c);
    const v97 = new ir.BinaryOperationVertex('&&', b, v96);
    const v106 = new ir.BinaryOperationVertex('&&', v71, v97);
    const v72 = new ir.BranchVertex();
    v72.condition = v106;
    v68.trueNext = v69;
    v69.next = v70;
    v70.next = v72;
    const v73 = new ir.PassVertex();
    v68.falseNext = v73;
    const v74 = new ir.CallVertex(v87, [v58, c]);
    const v99 = new ir.LiteralVertex(12);
    const v100 = new ir.BinaryOperationVertex('+', v74, v99);
    const v75 = new ir.LiteralVertex(0);
    const v76 = new ir.BinaryOperationVertex('>=', v100, v75);
    const v77 = new ir.CallVertex(v22, [v76]);
    v72.trueNext = v74;
    v74.next = v77;
    const v78 = new ir.CallVertex(v87, [v51, c]);
    const v101 = new ir.LiteralVertex(7);
    const v102 = new ir.BinaryOperationVertex('+', v78, v101);
    const v79 = new ir.BinaryOperationVertex('>=', v102, v75);
    const v80 = new ir.CallVertex(v22, [v79]);
    v72.falseNext = v78;
    v78.next = v80;
    const v81 = new ir.MergeVertex();
    v81.branch = v72;
    v77.next = v81;
    v80.next = v81;
    const v82 = new ir.PhiVertex();
    v82.addOperand({value: v74, srcBranch: v77});
    v82.addOperand({value: v78, srcBranch: v80});
    v82.merge = v81;
    const v83 = new ir.MergeVertex();
    v83.branch = v68;
    v81.next = v83;
    v73.next = v83;
    const v84 = new ir.PhiVertex(); // change
    v84.addOperand({value: v82, srcBranch: v81});
    v84.addOperand({value: v75, srcBranch: v73});
    v84.merge = v83;
    const v85 = new ir.ReturnVertex();
    v85.value = v84;
    v83.next = v85;

    const g = new ir.Graph([globalRet, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, v26, v27, v28, v29, v30, v31, v32, v33, v34, v35, v36, v37, v38, v39, v40, v41, v42, v43, v44, v45, v46, v47, v48, v49, v50, v51, v52, v53, v54, v55, v56, v57, v58, v59, v60, v61, v62, v63, v64, v65, v66, v67, v68, v69, v70, v71, v72, v73, v74, v75, v76, v77, v78, v79, v80, v81, v82, v83, v84, v85, v86, v87, v88, v89, v90, v91, v92, v93, v94, v95, v96, v97, v98, v99, v100, v101, v102, v103, v104, v105, v106, ep, d0, d1, d2, d3, a, b, c, d, ret], v1);
    await symbolicExecuteGraph(g, 'entry point', terminateAfterFirstBug, decisionMetricString, defaultTimeout);
}

async function testGraphFromExtractor(): Promise<void> {
    const g = ge.extractFromPath("graph_to_test.ts");
    await symbolicExecuteGraph(g, 'main', terminateAfterFirstBug, decisionMetricString, defaultTimeout);
}

async function main() {
    // INPUT ARGUMENTS:
    // node ./dist/unittest.js testIndex decisionMetricString
    // decisionMetricString: rand (random) / road (road-not-taken) / eps (epsilon-greedy)
    // optional:
    // --bugs - continue looking for bugs after the first bug was detected
    // --time=10 - timeout is set to 10 seconds. The default is 5 seconds

    // set test configuration
    const args = process.argv.slice(2);

    let testIndex: number = Number(args[0]);
    if (isNaN(testIndex)) {
        testIndex = 0;
        console.log("Invalid test index. Using default: " + testIndex);
    }

    let decisionStr = args[1];
    if (decisionStr == 'rand') {
        decisionMetricString = "random";
    } else if (decisionStr == 'road') {
        decisionMetricString = "road-not-taken";
    } else if (decisionStr == 'eps') {
        decisionMetricString = "epsilon-greedy";
    } else {
        console.log("Invalid decision metric string. Using default: " + decisionMetricString);
    }

    if (args.includes('--bugs')) {
        terminateAfterFirstBug = false;
    }
    
    let timeArg: number | undefined = getTimeFromArgs(args);
    if (timeArg !== undefined) {
        defaultTimeout = timeArg;
    }

    let symbexTestSuite: Array<AsyncUnitTest> = [
        new AsyncUnitTest('Equation with solution', testEquationWithSolution),       // 0
        new AsyncUnitTest('Equation without solution', testEquationWithoutSolution), // 1
        new AsyncUnitTest('Merge and Phi vertices', testMergeAndPhi),                // 2
        new AsyncUnitTest('Call with return value', testCallWithReturnValue),        // 3
        new AsyncUnitTest('Load and store', testLoadAndStore),                       // 4
        new AsyncUnitTest('Long mixed code', testLongMixedCode),                     // 5
        new AsyncUnitTest('Graph from extractor', testGraphFromExtractor),           // 6
    ];
    await symbexTestSuite[testIndex].runTest();
}

main().then(() => {
    process.exit(0);
});
