import { pipeline } from 'node:stream/promises'
import { createReadStream, createWriteStream, statSync } from 'fs';
import split2 from 'split2'
import { BufferingTransform } from './buffer.js';
import { SortingTransform } from './sort.js';
import { StringifyTransform } from './stringify.js';
import { PartitionWritable } from './partition.js';
import { MergingReadable } from './merge.js'

export async function externalSort(inputPath, outputPath, workingDir, memory, skipCleanUp, compareFn) {
    const files = await partition(inputPath, workingDir, memory, compareFn);
    await merge(files, outputPath, skipCleanUp, compareFn);
}

async function partition(inputPath, workingDir, memory, compareFn) {
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

async function merge(files, outputPath, skipCleanUp, compareFn) {
    const mergingReadable = new MergingReadable({ files: files, compareFn: compareFn, skipCleanUp: skipCleanUp });
    const output = createWriteStream(outputPath);

    await pipeline(
        mergingReadable,
        output
    )
}