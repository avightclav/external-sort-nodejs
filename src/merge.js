import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs'
import { rm } from 'fs/promises';
import split2 from 'split2'

function sortedIndex(array, value, compareFn) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (compareFn(array[mid][0], value)) low = mid + 1;
        else high = mid;
    }
    return low;
}

async function readSingleChunk(readable) {
    const next = await readable.next();
    if (next.done !== true) {
        return next.value;
    } else {
        return null;
    }
}

async function peekReadables(readables) {
    const peek = []
    for (const readable of readables) {
        const head = await readSingleChunk(readable);
        peek.push([head, readable]);
    }
    return peek;
}

export class MergingReadable extends Readable {
    constructor(options) {
        super(options);
        this.splitOptions = options.splitOptions || {};
        this.files = options.files;
        this.compareFn = options.compareFn;
        this.sortedPeek = [];
        this.skipCleanUp = options.skipCleanUp || false;
        this.delimeter = options.delimeter || '\n';

        this.readables = [];
        this.readableIterators = [];
        for (const file of this.files) {
            const readable = createReadStream(file).pipe(split2({ ...this.splitOptions }));
            if (!this.skipCleanUp) {
                readable.on('close', () => {
                    rm(file);
                })
            }
            const readableAsyncIterator = readable[Symbol.asyncIterator]();
            this.readableIterators.push(readableAsyncIterator);
            this.readables.push(readable);
        }
    }

    _construct(callback) {
        peekReadables(this.readableIterators).then((peek) => {
            this.sortedPeek = peek.sort((a, b) => this.compareFn(a[0], b[0]));
            callback();
        });
    }

    _read() {
        if (this.sortedPeek.length == 0) {
            this.push(null);
        } else {
            const [firstElement, readable] = this.sortedPeek.pop();
            readSingleChunk(readable).then((nextFromFirstReadable) => {
                if (nextFromFirstReadable != null) {
                    const index = sortedIndex(this.sortedPeek, nextFromFirstReadable, this.compareFn);
                    this.sortedPeek.splice(index, 0, [nextFromFirstReadable, readable]);
                }
                this.push(firstElement + this.delimeter);
            })
        }
    }

    _destroy(err) {
        if (err) {
            for (const readable of this.readables) {
                readable.destroy();
            }
        }
    }
} 