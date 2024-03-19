#!/usr/bin/env node

import { argv } from 'node:process'
import { parseArgs } from 'node:util'
import { externalSort } from './src/external-sort.js';


await main();

async function main() {
    const options = {
        output: {
            type: 'string',
            short: 'o'
        },
        input: {
            type: 'string',
            short: 'i'
        },
        memory: {
            type: 'string',
            short: 'm'
        },
        workingDir: {
            type: 'string',
            short: 'd',
            raw: 'working-dir'
        }
    }
    const { values, positionals } = parseArgs({ argv, options })

    const inputPath = values.input
    const outputPath = values.output
    const memory = parseInt(values.memory)
    const workingDir = values.workingDir
    const compareFn = (a, b) => a.toString().localeCompare(b.toString());
    // const compareFn = (a, b) => Number(a.toString()) - Number(b.toString());

    await externalSort(inputPath, outputPath, workingDir, memory, false, compareFn);
}



