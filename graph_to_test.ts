// main is the analyzed function by symbex
// its params are the symbolic variables, their types can be number/boolean
function main(a: number, b: number) {
    if (a > 0 && b > 0) {
        if (a <= b) {
            let i = 3;
            while (i > 0) {
                i = i - 1;
            }
        }
        else {
            let i = 0;
            while (i < 4) {
                i = a + 1;
            }
            assert(i != 6 && b != 1); // bug only if a=5, b=1
        }
    }
}

// assert must be declared with a boolean param
function assert(cond: boolean) {
    return; // not reachable
}

// main is must be called, the input values have no effect on the analysis
main(1, 2);