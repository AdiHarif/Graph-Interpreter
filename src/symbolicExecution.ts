import assert from 'assert';
import * as ir from 'graphir';
import * as z3 from 'z3-solver';
import PriorityQueue from 'ts-priority-queue';
import { SymbolicExpression } from "./symbolic_interpreter";
import { State, VertexId } from './state';
import { Path, comparePaths } from './path';
import { Bug } from './bug';

export let z3Context: z3.Context<"main">;

// decision metrics for selecting the next node in the path when a branch occurs
type decisionMetric = (symbex: SymbolicExecution, path: Path, trueNext: ir.ControlVertex, falseNext: ir.ControlVertex) => boolean;
export let decisionMetricsTable: { [key: string]: decisionMetric } = {
    "random": randomChoice,
    "road-not-taken": roadNotTaken,
    "epsilon-greedy": epsilonGreedy
};

class SymbolicExecution {
    // configurations
    private _terminateAfterFirstBug: boolean;
    private _decisionMetric: string;
    private _timeout: number;

    // paths queue sorted by total global visit count in decreasing order
    private _pathsPriorityQueue: PriorityQueue<Path>;

    private _symbols: Array<SymbolicExpression> = [];
    private _bugsList: Array<Bug> = [];
    private _globalVisitCount: { [key: VertexId]: number } = {}; 
    private _globalBugPotentialScore: { [key: VertexId]: number } = {};

    // epsilon-greedy episodes counter
    private _greedyEpsilonEpisode: number = 0;

    // Statistics
    private _startTime: number = 0;
    private _totalNumOfPaths: number = 0;
    
    constructor(terminateAfterFirstBug: boolean, decisionMetricString: string, timeout: number, startTime: number) {
        this._terminateAfterFirstBug = terminateAfterFirstBug;
        this._decisionMetric = decisionMetricString;
        this._timeout = timeout;
        this._startTime = startTime;
        this._pathsPriorityQueue = new PriorityQueue({ comparator: comparePaths });
    }

    public printResult() {
        let time: number = (new Date().getTime() - this._startTime) / 1000;
        console.log("# Symbolic Execution Terminated #");
        console.log("Timeout:                   " + this._timeout + " seconds");
        console.log("Decision metric:           " + this._decisionMetric);
        console.log("Terminate after first bug: " + this._terminateAfterFirstBug);
        console.log("Total number of paths:     " + this._totalNumOfPaths);
        console.log("Total execution time:      " + time + " seconds");
        console.log("Graph coverage:            " + Number(this.getGraphCoverage()).toFixed(2) + "%");
        if (this._bugsList.length > 0) {
            console.log("Found " + this._bugsList.length + " bugs!");
            for (let i = 0; i < this._bugsList.length; i++) {
                console.log(`Bug #${i + 1}:`);
                let values: Array<z3.Expr> = this._bugsList[i].evalModel(this._symbols);
                for (let j = 0; j < values.length; j++) {
                    console.log(`p${j} = ${values[j]}`);
                }
            }
        }
        else {
            console.log("Didn't find any bugs!");
        }
    }

    public setGlobalVisitCount(globalVisitCount: { [key: VertexId]: number }) {
        this._globalVisitCount = globalVisitCount;
    }

    public terminateAfterFirstBug(): boolean {
        return this._terminateAfterFirstBug;
    }

    public pushPath(newPath: Path) {
        this._pathsPriorityQueue.queue(newPath);
        this._totalNumOfPaths++;
    }

    get nextPath(): Path | undefined {
        if (this._pathsPriorityQueue.length == 0) {
            return undefined;
        }
        return this._pathsPriorityQueue.dequeue();
    }

    public addSymbol(symbol: SymbolicExpression) {
        this._symbols.push(symbol);
    }

    get symbols(): Array<SymbolicExpression> {
        return this._symbols;
    }

    private addBug(bug: Bug) {
        this._bugsList.push(bug);
    }

    private visitNode(path: Path, node: ir.ControlVertex) {
        if (this._globalVisitCount[node.id] == undefined) {
            assert(false, `visitNode - globalVisitCount[${node.id}] is undefined`)
        }
        this._globalVisitCount[node.id]++;
        path.visitNode(node);
    }

    // increment visit count without visiting - used for unreachable nodes
    // because of GraphIR limitations, some nodes are required to build the graph
    // but they are not being visited during the analysis
    private incrementVisitCount(id: VertexId) {
        if (this._globalVisitCount[id] == undefined) {
            assert(false, `visitNode - globalVisitCount[${id}] is undefined`)
        }
        this._globalVisitCount[id]++;
    }

    public getGraphCoverage(): number {
        let numOfVisitedNodes: number = 0;
        let numOfNodes: number = 0;
        for (let id in this._globalVisitCount) {
            numOfNodes++;
            if (this._globalVisitCount[id] > 0) {
                numOfVisitedNodes++;
            }
        }
        return (numOfVisitedNodes / numOfNodes) * 100;
    }

    // sum the total global visit count of all nodes along the given sequence
    // use sequence and not path because the result is given to the path
    // constructor when pushing a new path to the priority queue
    private getPathTotalVisitCount(sequence: Array<ir.ControlVertex>) {
        let pathTotalVisitCount = 0;
        for (let node of sequence) {
            pathTotalVisitCount += this._globalVisitCount[node.id];
        }
        return pathTotalVisitCount;
    }

    public get decisionMetric(): string {
        return this._decisionMetric;
    }

    public get episode(): number {
        this._greedyEpsilonEpisode++;
        return this._greedyEpsilonEpisode;
    }

    // give a score of 1 point to each node in the path
    // called when an assert is reached but not hit
    private setBugPotentialScore(path: Path) {
        for (let node of path.nodeSequence) {
            if (this._globalBugPotentialScore[node.id] == undefined) {
                this._globalBugPotentialScore[node.id] = 1;
            }
            this._globalBugPotentialScore[node.id]++;
        }
    }

    // returns the vertex "bug-potential score"
    // a vertex with higher score is more likely to lead to a bug
    public getBugPotentialScore(id: VertexId): number {
        if (this._globalBugPotentialScore[id] == undefined) {
            return 0;
        }
        return this._globalBugPotentialScore[id];
    }

    /**
     * Executes a program path until:
     * - its fuel runs out /
     * - a bug is found /
     * - the current node reached its visit limit for this path /
     * - the program ended
     *
     * @param path - The program execution path to be executed.
     * @returns `true` if a bug is found during execution, `false` otherwise.
     */
    public async symbolicExecutePath(path: Path): Promise<boolean> {
        let previousNode: ir.ControlVertex | undefined = path.nodeBeforeTail;
        let currentNode: ir.ControlVertex | undefined = path.tail;
        let nextNode: ir.ControlVertex | undefined;
        
        while ((path.step() > 0) && (currentNode !== undefined)) {
            // limit visits
            if (path.getVisitCount(currentNode.id) > 50) {
                break;
            }

            this.visitNode(path, currentNode);
    
            if (currentNode instanceof ir.BranchVertex) {
                try {
                    nextNode = await this.symbolicExecuteBranchNode(path, currentNode);
                } catch(err) {
                    console.log("error in branch node " + currentNode.id + ": " + err);
                    process.exit(1);
                }
            }
            else if ((currentNode instanceof ir.CallVertex) && (currentNode.callee!.label == "#assert")) {
                try {
                    nextNode = await this.handleAssert(path, currentNode);
                    if (nextNode == undefined) {
                        // found a bug
                        return true;
                    }
                } catch(err) {
                    console.log("error in assert node " + currentNode.id + ": " + err);
                    process.exit(1);
                }    
            }
            else { // other type of control vertex
                try {
                nextNode = path.executeControlNode(currentNode, previousNode!);
                } catch(err) {
                    console.log("error in control node: " + currentNode.id + ": " + err);
                    process.exit(1);
                }
            }
    
            previousNode = currentNode;
            currentNode = nextNode;
        }
    
        // path terminated without reaching a bug
        return false;
    }

    /**
     * Handles the evaluation and processing of an assertion in a program path.
     * If the assert's condition can be false, adds the accumulated constraints to the bugs list. 
     *
     * @param path - The program execution path.
     * @param node - The assertion node to be evaluated.
     * @returns A control vertex for the next step in the path.
     */
    private async handleAssert(path: Path, node: ir.CallVertex): Promise<ir.ControlVertex | undefined> {
        let args: Array<ir.DataVertex> = node.args!;
        assert(args.length == 1, `Reached assert with other than 1 condition!`);

        // update visit count for unreachable nodes
        let functionSymbol: ir.SymbolVertex = node.callee as ir.SymbolVertex;
        let startVertex: ir.StartVertex = functionSymbol.startVertex as ir.StartVertex;
        this.incrementVisitCount(startVertex.id);
        this.incrementVisitCount(startVertex.next!.id);

        // evaluate condition and path constraints
        let condition: SymbolicExpression = path.evaluateDataNode(path.getTopState(), args[0] as ir.DataVertex) as SymbolicExpression;
        let pathConstraints: SymbolicExpression | undefined = path.constraints;
        let truePathConstraints: SymbolicExpression;
        let falsePathConstraints: SymbolicExpression;
    
        if (pathConstraints !== undefined) {
            truePathConstraints = (<z3.Bool>pathConstraints).and((<z3.Bool>condition));
            falsePathConstraints = (<z3.Bool>pathConstraints).and((<z3.Bool>condition).not());
        }
        else {
            truePathConstraints = condition;
            falsePathConstraints = (<z3.Bool>condition).not();
        }
        let conditionResult = await smtSolve(truePathConstraints);
        let logicalNotResult = await smtSolve(falsePathConstraints);
    
        if (logicalNotResult == "sat") {
            // assertion failed - the condition might become false under the path constraints
            // add the bug to the bugs list
            let model = await smtGetModel(falsePathConstraints);
            this.addBug(new Bug(model));
            if (this.terminateAfterFirstBug()) {
                return undefined;
            }
    
            if (conditionResult == "sat") {
                // both true and false are possible
                // continue the path with the true condition
                path.addConstraint(condition);

                // the assert is reached but not hit - each node along the path
                // has higher potential to lead to a bug from a different path
                this.setBugPotentialScore(path);
                return node.next as ir.ControlVertex;
            }
            else {
                // contradiction - the assert has been proven to be always false
                // terminate path
                return undefined;
            }
        }
        else {
            if (conditionResult == "sat") {
                // tautology - the assert's condition has been proven to be always true
                return node.next as ir.ControlVertex;
            }
        }
        return undefined;
    }

    /**
     * Evaluates a branch node in the program path.
     *
     * @param path - The program execution path.
     * @param node - The branch node to be evaluated.
     * @returns A control vertex for the next step in the path.
     */
    private async symbolicExecuteBranchNode(path: Path, node: ir.BranchVertex): Promise<ir.ControlVertex | undefined> {
        // evaluate condition and path constraints
        let condition: SymbolicExpression = path.evaluateDataNode(path.getTopState(), node.condition as ir.DataVertex) as SymbolicExpression;
        let pathConstraints: SymbolicExpression | undefined = path.constraints;
        let truePathConstraints: SymbolicExpression;
        let falsePathConstraints: SymbolicExpression;
    
        if (pathConstraints !== undefined) {
            truePathConstraints = (<z3.Bool>pathConstraints).and((<z3.Bool>condition));
            falsePathConstraints = (<z3.Bool>pathConstraints).and((<z3.Bool>condition).not());
        }
        else {
            truePathConstraints = condition;
            falsePathConstraints = (<z3.Bool>condition).not();
        }
        let conditionResult = await smtSolve(truePathConstraints);
        let logicalNotResult = await smtSolve(falsePathConstraints);
    
        if (conditionResult == "sat") {
            if (logicalNotResult == "sat") {
                // both true and false are possible
                return this.choosePath(path, node, condition, truePathConstraints, falsePathConstraints);
            }
            else {
                // tautology - the condition is always true
                return node.trueNext as ir.ControlVertex;
            }
        }
        else {
            if (logicalNotResult == "sat") {
                // contradiction - the condition is always false
                return node.falseNext as ir.ControlVertex;
            }
        }
        return undefined;
    }

    /**
     * Chooses between two program paths based on a decision metric.
     * The chosen path is continued on and the other one is pushed to the queue.
     *
     * @param path - The current program execution path.
     * @param node - The branch node that requires a choice.
     * @param condition - The symbolic expression representing the branch condition.
     * @param truePathConstraints - The constraints for the true path.
     * @param falsePathConstraints - The constraints for the false path.
     * @returns A control vertex for the chosen path.
     */
    private choosePath(path: Path, node: ir.BranchVertex, condition: SymbolicExpression, truePathConstraints: SymbolicExpression, falsePathConstraints: SymbolicExpression): ir.ControlVertex {
        let choice: boolean = decisionMetricsTable[this.decisionMetric](this, path, node.trueNext as ir.ControlVertex, node.falseNext as ir.ControlVertex);

        if (choice == true) {
            // proceed on the true path
            let sequence: Array<ir.ControlVertex> = path.cloneNodeSequence()
            sequence.push(node.falseNext!);
            let falsePath: Path = new Path(path.cloneStatesStack(), path.fuel, path.cloneVisitCount(), sequence, this.getPathTotalVisitCount(sequence), falsePathConstraints);
            this.pushPath(falsePath);
            path.addConstraint(condition);
            return node.trueNext as ir.ControlVertex;
        }
        else {
            // proceed on the false path
            let sequence: Array<ir.ControlVertex> = path.cloneNodeSequence()
            sequence.push(node.trueNext!);
            let truePath: Path = new Path(path.cloneStatesStack(), path.fuel, path.cloneVisitCount(), sequence, this.getPathTotalVisitCount(sequence), truePathConstraints);
            this.pushPath(truePath);
            path.addConstraint((<z3.Bool>condition).not());
            return node.falseNext as ir.ControlVertex;
        }
    }
}

async function smtSolve(expression: SymbolicExpression): Promise<string> {
    const { Solver } = z3Context;
    const solver = new Solver();
    solver.add(<z3.Bool>expression);
    let sat = await solver.check();
    return sat;
}

async function smtGetModel(expression: SymbolicExpression): Promise<z3.Model> {
    const { Solver } = z3Context;
    const solver = new Solver();
    solver.add(<z3.Bool>expression);
    let sat = await solver.check();
    return solver.model();
}

/**
 * Initializes symbolic execution with a specified function in a given program graph.
 *
 * @param symbex - The symbolic execution engine.
 * @param graph - The program graph to analyze.
 * @param functionToAnalyze - The name of the function to analyze.
 */
function initializeSymbolicExecution(symbex: SymbolicExecution, graph: ir.Graph, functionToAnalyze: string) {
    // find the function's start vertex
    let entryNode: ir.StartVertex | undefined = undefined;
    let args: Array<ir.DataVertex> = [];
    for (let node of graph.vertices) {
        if (node.kind == ir.VertexKind.Call) {
            let call = <ir.CallVertex>(node);
            if (call.callee?.label == '#' + functionToAnalyze) {
                args = call.args!;
                assert(args.length > 0, `Funtion "${functionToAnalyze}" doesn't have any arguments`);
                entryNode = (<ir.SymbolVertex>(call.callee)).startVertex;
                break;
            }
        }
    }
    assert(entryNode != undefined, `Function ${functionToAnalyze} doesn't exist in the graph`);
    
    // initiate the visit count for each control vertex
    let globalVisitCount: { [key: VertexId]: number } = {};
    for (let node of graph.vertices) {
        let vertexCategory: string = node.category;
        if (vertexCategory == ir.VertexCategory.Control || vertexCategory == ir.VertexCategory.Compound) {
            globalVisitCount[node.id] = 0;
        }
    }
    symbex.setGlobalVisitCount(globalVisitCount);
    
    // initiate the symbolic variables
    let globalState: State<SymbolicExpression> = new State(undefined);
    const { Real, Bool } = z3Context;
    for (let i = 0; i < args.length; i++) {
        let exp: SymbolicExpression;
        let argType: ir.Value = typeof (<ir.LiteralVertex>args[i]).value!;
        assert(argType == 'boolean' || argType == 'number', `Symbolic argument #${i} doesn't specify its type. value: ${argType}`);
        if (argType == 'number') {
            exp = Real.const(`p${i}`);
        }
        else {
            exp = Bool.const(`p${i}`);
        }
        globalState.addParameterData(exp as SymbolicExpression);
        symbex.addSymbol(exp as SymbolicExpression);
    }

    // initiate the main path
    let mainPath: Path = new Path([globalState], 500, {}, [entryNode], 0);
    symbex.pushPath(mainPath);
}

/**
 * Performs symbolic execution on a given program graph for a specified function.
 *
 * @param graph - The program graph to analyze.
 * @param functionToAnalyze - The name of the function to analyze.
 * @param terminateAfterFirstBug - Indicates whether to terminate execution after the first bug is found.
 * @param decisionMetricString - The decision metric for choosing paths.
 * @returns A Promise that resolves when symbolic execution is complete.
 * @throws Error if the input graph is invalid or if there are issues with Z3 initialization.
 */
export async function symbolicExecuteGraph(graph: ir.Graph, functionToAnalyze: string, terminateAfterFirstBug: boolean, decisionMetricString: string, defaultTimeout: number): Promise<void> {
    if (graph.verify() == false) {
        throw new Error(`Invalid graph input`);
    }

    let symbex: SymbolicExecution = new SymbolicExecution(terminateAfterFirstBug, decisionMetricString, defaultTimeout, new Date().getTime());

    const timeoutId = setTimeout(() => {
        console.log("# TIMEOUT EXPIRED #");
        symbex.printResult();
        process.exit(1);
    }, defaultTimeout * 1000);

    try {
        const { Context } = await z3.init();
        z3Context = Context("main");
    }
    catch(err) {
        console.log("z3 failed to initialize, error: " + err);
    }

    initializeSymbolicExecution(symbex, graph, functionToAnalyze);

    // choose a path from the queue and execute it until its fuel runs out
    while (true) {
        let currentPath: Path | undefined = symbex.nextPath;
        if (currentPath == undefined) {
            // no more paths to execute
            break;
        }

        let bugWasFound: boolean = await symbex.symbolicExecutePath(currentPath!);
        if (bugWasFound == true) {
            if (symbex.terminateAfterFirstBug() == true) {
                break;
            }
        }
    }

    clearTimeout(timeoutId);
    symbex.printResult();

    return;
}

/**
 * Decides which path to take based on a metric comparing visit counts of two potential paths.
 *
 * @param symbex - The symbolic execution engine.
 * @param path - The current program execution path.
 * @param trueNext - The control vertex representing the true branch.
 * @param falseNext - The control vertex representing the false branch.
 * @returns `true` if the true branch is chosen, `false` if the false branch is chosen.
 */
function roadNotTaken(symbex: SymbolicExecution, path: Path, trueNext: ir.ControlVertex, falseNext: ir.ControlVertex): boolean {
    // Two roads diverged in a wood, and I,
    // I took the one less traveled by,
    // and that has made all the difference. -Robert Frost
    let trueVisitCount: number = path.getVisitCount(trueNext.id);
    let falseVisitCount: number = path.getVisitCount(falseNext.id);
    return trueVisitCount < falseVisitCount;
}

// Randomly selects one of two paths with a 50% probability for each
function randomChoice(symbex: SymbolicExecution, path: Path, trueNext: ir.ControlVertex, falseNext: ir.ControlVertex): boolean {
    return Math.random() < 0.5;
}

/**
 * Implements an epsilon-greedy strategy for choosing between two paths based on exploration and exploitation.
 * The strategy balances exploration and exploitation to maximize bug discovery.
 * Exploit: choose the vertex that has higher chance to lead to a bug
 * Explore: choose the vertex that is least likely to lead to a bug
 *
 * @param symbex - The symbolic execution engine.
 * @param path - The current program execution path.
 * @param trueNext - The control vertex representing one of the paths.
 * @param falseNext - The control vertex representing the other path.
 * @returns `true` if the true branch is chosen for exploitation or `false` for exploration based on the epsilon-greedy strategy.
 */
function epsilonGreedy(symbex: SymbolicExecution, path: Path, trueNext: ir.ControlVertex, falseNext: ir.ControlVertex): boolean {
    let trueNodeScore: number = symbex.getBugPotentialScore(trueNext.id);
    let falseNodeScore: number = symbex.getBugPotentialScore(falseNext.id);

    // determine which node is the exploited and which is the explored based on the score
    // exploit: choose the vertex that has higher chance to lead to a bug
    // explore: choose the vertex that is least likely to lead to a bug
    let explore: boolean = true;
    if (trueNodeScore >= falseNodeScore) {
        // trueNext is the exploited
        explore = false;
    }

    // calc epsilon (the probability of choosing to explore) - its value reduces exponentially
    // over time to start with exploration and then focus on exploitation to find the bug faster
    let min_epsilon: number = 0.2;
    let max_epsilon: number = 1;
    let decay_rate: number = 0.999;
    let epsilon: number = min_epsilon + (max_epsilon - min_epsilon) * Math.exp(-decay_rate * symbex.episode);
    
    // random tradeoff value between 0 to 1
    let tradeoff: number = Math.random();

    if (tradeoff < epsilon) {
        // explore
        return explore;
    }
    // exploit
    return !explore;
}
