import { Transform } from 'node:stream';
import { Buffer } from 'node:buffer'

const DEFAULT_CAPACITY = 256000;

export class BufferingTransform extends Transform {
    constructor(options = {}) {
        super({ options, readableObjectMode: true });

        this.capacity = options.capacity || DEFAULT_CAPACITY;
        this.delimeterSize = Buffer.byteLength("\n", 'utf8')
        this.size = 0;
        this.pending = [];
    }

    atCapacity(nextChunkSize) {
        return (this.size + nextChunkSize) > this.capacity;
    }

    _transform(chunk, _encoding, cb) {
        const nextChunkSize = Buffer.byteLength(chunk, 'utf8') + this.delimeterSize

        if (this.atCapacity(nextChunkSize)) {
            this.size = 0;
            const fullBuffer = this.pending;
            this.pending = [];
            this.push(fullBuffer);
        }

        this.size += nextChunkSize;
        this.pending.push(chunk);

        cb();
    }

    _flush(callback) {
        const fullBuffer = this.pending;
        this.pending = [];
        this.push(fullBuffer);
        callback();
    }
}