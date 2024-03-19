import { Writable, Stream } from 'node:stream'
import { createWriteStream } from 'fs';

async function writeToPath(chunk, path, _callback, destroyCallback) {
    const chunkWrapper = new Stream.Readable();
    chunkWrapper.push(chunk, 'utf8');
    chunkWrapper.push(null);
    const writeStream = createWriteStream(path)
    return chunkWrapper.pipe(writeStream)
        .on('finish', () => {
        })
        .on('error', (err) => {
            // propagate error to master stream
            destroyCallback(err);
        });
}

export class PartitionWritable extends Writable {
    constructor(options = {}) {
        super(options);

        this.chunksWritten = 0;
        this.workingDir = options.workingDir;
        this.files = [];
        this.writes = [];
    }

    _write(chunk, encoding, callback) {
        const path = this.workingDir + `/partition_${this.chunksWritten}.txt`;
        this.files.push(path);
        this.chunksWritten += 1;
        writeToPath(chunk, path, callback, this.destroy);
        callback(null);
    }

    _writev(chunks, encoding, callback) {
        console.log('writev');
        for (const chunk of chunks) {
            const path = this.workingDir + `/partitition_${this.chunksWritten}.txt`;
            this.files.push(path);
            this.chunksWritten += 1;
            writeToPath(chunk, path, callback, this.destroy);
        }
        callback(null);
    }

    _destroy(err, callback) {
        Promise.allSettled(this.writes).then(() => {
            callback(err);
        });
    }
}