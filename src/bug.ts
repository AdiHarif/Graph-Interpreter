import * as z3 from 'z3-solver';
import { SymbolicExpression } from "./symbolic_interpreter";

/**
 * Class to represent a bug in the analyzed program.
 * A bug is an assert in the primitive program that might be not satisfied.
 */
export class Bug {
    // Possibe values of the symbols that can lead to the bug
    private _model: z3.Model;

    constructor(model: z3.Model) {
        this._model = model;
    }

    public evalModel(symbols: Array<SymbolicExpression>): Array<z3.Expr> {
        let values: Array<z3.Expr> = [];
        for (var i in symbols) {
            try {
                values.push(this._model.eval(<z3.Arith>(symbols[i]), true));
            }
            catch (err) {
                console.log(`evalModel for symbol[${i}] - exception: ` + err);
            }
        }
        return values;
    }
}
