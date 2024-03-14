import { Transform } from 'node:stream';

export class StringifyTransform extends Transform {
    constructor(options = {}) {
        super({ ...options, readableObjectMode: false, writableObjectMode: true });
        this.delimeter = options.delimeter || '\n';
        return;
    }

    _transform(array, _encoding, cb) {
        let stringified = "";
        while (array.length > 1) {
            stringified += array.shift() + this.delimeter;
        }
        stringified += array.shift()
        this.push(stringified, 'utf8')

        cb();
    }
}