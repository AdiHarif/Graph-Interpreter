# Graph Interpreter

## Introduction

This is a graph interpreter, it takes a typescript program written in the intermidiate representation (IR) of a graph (like GRAAL) and executes it.
The GraphIR module is declared here: https://github.com/AdiHarif/GraphIR

**The graph interpreter has 2 features:**
1. It can execute the given program and return a value. This is a **concrete interpreter**, and it's useful for software analysis and compilation optimizations. 
2. It can perform a **symbolic execution** on the given program. That is, finding a certain values for the program input that can lead to a bug.  
A bug is defined as an assert call condition that its negation is SAT. The program input is the analyzed function's input parameters, which are refered to as "symbolic parameters". The symbolic execution engine executes different paths of the program, collects the constraints that apply on the symbolic parameters, and calls Z3 SMT Solver APIs to deduce bugs.

## Install

First install [GraphIR](https://github.com/AdiHarif/GraphIR):

```bash
git clone https://github.com/AdiHarif/GraphIR # (not necessarily in Graph-Interpreter directory)
cd GraphIR
npm install
npm run build
npm link
```

Then install Graph-Interpreter:

```bash
git clone https://github.com/AdiHarif/Graph-Interpreter
cd Graph-Interpreter
npm install
npm link graphir
```

## Build

```bash
npm run build
```

## Test
To run all test suites of the **concrete interpreter** using jest:
```bash
npm test
```
To run a test of the **symbolic execution**:
```bash
# default test index: 0, default decision metric: random, default timeout: 5 sec
node ./dist/unittest.js 
```
To run a test with unique configurations:
```bash
node ./dist/unittest.js i decisionMetric
```
**i** - test index: 0, 1, ..., 6  
**decisionMetric** - the method that takes place when the symbolic execution engine decided which node to continue on upon a branch node with 2 possiblities: rand (random) / road (road-not-taken) / eps (epsilon-greedy)  
**Optional flags:**  
**--bugs** - continue looking for bugs after the first bug was detected  
**--time=10** - timeout is set to 10 seconds (The default is 5 seconds)