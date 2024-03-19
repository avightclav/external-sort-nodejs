import { test } from "node:test";
import fs from 'node:fs/promises';
import path from "node:path";
import os from 'node:os';
import { externalSort } from "../src/external-sort.js";
import assert from "node:assert";

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}


test('algoritm correctness', async () => {
    const englishAlphabet = [
        "a", "b", "c", "d", "e",
        "f", "g", "h", "i", "j",
        "k", "l", "m", "n", "o",
        "p", "q", "r", "s", "t",
        "u", "v", "w", "x", "y",
        "z"
    ];
    const unsortedAlphabet = shuffle([...englishAlphabet]).join('\n');

    const expectedOutput = englishAlphabet.join('\n') + '\n';
    const expectedPartitionCount = 6;

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "external-sort"));
    const workingDir = path.join(tempDir, "tmp");
    await fs.mkdir(workingDir);
    const inputPath = path.join(tempDir, "input.txt");
    const outputPath = path.join(tempDir, "output.txt");
    const compareFn = (a, b) => a.toString().localeCompare(b.toString());
    await fs.writeFile(inputPath, unsortedAlphabet);
    const memory = 10;

    await externalSort(inputPath, outputPath, workingDir, memory, true, compareFn);
    const partitionCount = (await fs.readdir(workingDir)).length;
    const output = await fs.readFile(outputPath, 'utf-8');

    assert.strictEqual(partitionCount, expectedPartitionCount);
    assert.strictEqual(output, expectedOutput);
})