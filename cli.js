#!/usr/bin/env node

import { pipeline } from 'node:stream/promises'
import { argv } from 'node:process'
import { parseArgs } from 'node:util'
import { createReadStream, createWriteStream, statSync } from 'fs';
import split2 from 'split2'
import { BufferingTransform } from './src/buffer.js';
import { SortingTransform } from './src/sort.js';
import { StringifyTransform } from './src/stringify.js';
import { PartitionWritable } from './src/partition.js';
import { MergingReadable } from './src/merge.js'

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

partition()
    .then((files) => merge(files))
    .catch( (err) => console.log(err));

async function partition() {
    const fileSize = statSync(inputPath).size;
    const partitionFactor = Math.floor(fileSize / memory);
    const maxLineLength = memory / partitionFactor;
    const readStream = createReadStream(inputPath, { encoding: 'utf8' });
    const splitTransformer = split2({ maxLength: maxLineLength, skipOverflow: false });
    const bufferingTransformer = new BufferingTransform({ writableObjectMode: false, capacity: memory });
    const sortingTransformer = new SortingTransform({ compareFn: compareFn });
    const stringifyTransformer = new StringifyTransform({});
    const outputStream = new PartitionWritable({ workingDir: workingDir, objectMode: true });

    await pipeline(
        readStream,
        splitTransformer,
        bufferingTransformer,
        sortingTransformer,
        stringifyTransformer,
        outputStream
    )

    return outputStream.files
}

async function merge(files) {
    const mergingReadable = new MergingReadable({ files: files, compareFn: compareFn, skipCleanUp: false });
    const output = createWriteStream(outputPath);

    await pipeline(
        mergingReadable,
        output
    )
}



