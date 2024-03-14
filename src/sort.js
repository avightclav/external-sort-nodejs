import { Transform } from 'node:stream';

export class SortingTransform extends Transform {
    constructor(options = {}) {
        super({ ...options, objectMode: true });

        this.compareFn = options.compareFn;
    }

    _transform(chunk, _encoding, cb) {
        this.push(chunk.sort(this.compareFn));

        cb();
    }
}