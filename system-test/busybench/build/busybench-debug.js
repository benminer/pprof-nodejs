"use strict";
/**
 * Debug version of busybench to isolate segfault
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const pprof_1 = require("pprof");
console.log('1. Imports loaded');
const startTime = Date.now();
const testArr = [];
console.log('2. Variables initialized');
function busyLoop(durationSeconds) {
    for (let i = 0; i < testArr.length; i++) {
        for (let j = 0; j < testArr[i].length; j++) {
            testArr[i][j] = Math.sqrt(j * testArr[i][j]);
        }
    }
    if (Date.now() - startTime < 1000 * durationSeconds) {
        setTimeout(() => busyLoop(durationSeconds), 5);
    }
}
console.log('3. busyLoop defined');
function benchmark(durationSeconds) {
    // Allocate 16 MiB in 64 KiB chunks.
    for (let i = 0; i < 16 * 16; i++) {
        testArr[i] = new Array(64 * 1024);
    }
    busyLoop(durationSeconds);
}
console.log('4. benchmark defined');
async function collectAndSaveTimeProfile(durationSeconds, sourceMapper) {
    console.log('6a. Starting time profile');
    const profile = await pprof_1.time.profile({
        durationMillis: 1000 * durationSeconds,
        sourceMapper,
    });
    console.log('6b. Time profile collected, encoding');
    const buf = await (0, pprof_1.encode)(profile);
    console.log('6c. Time profile encoded, writing');
    await fs_1.promises.writeFile('time.pb.gz', buf);
    console.log('6d. Time profile written');
}
async function collectAndSaveHeapProfile(sourceMapper) {
    console.log('7a. Starting heap profile collection');
    const profile = await pprof_1.heap.profile(undefined, sourceMapper);
    console.log('7b. Heap profile collected, encoding');
    const buf = await (0, pprof_1.encode)(profile);
    console.log('7c. Heap profile encoded, writing');
    await fs_1.promises.writeFile('heap.pb.gz', buf);
    console.log('7d. Heap profile written');
    console.log('7e. Stopping heap profiler');
    pprof_1.heap.stop();
    console.log('7f. Heap profiler stopped');
}
async function collectAndSaveProfiles() {
    console.log('5a. Creating SourceMapper');
    const sourceMapper = await pprof_1.SourceMapper.create([process.cwd()]);
    console.log('5b. SourceMapper created');
    await collectAndSaveTimeProfile(durationSeconds, sourceMapper);
    await collectAndSaveHeapProfile(sourceMapper);
    console.log('8. All profiles saved, exiting');
}
const durationSeconds = Number(process.argv.length > 2 ? process.argv[2] : 30);
console.log('Starting with duration:', durationSeconds);
console.log('Starting heap profiler');
pprof_1.heap.start(512 * 1024, 64);
console.log('Heap profiler started');
console.log('Starting benchmark');
benchmark(durationSeconds);
console.log('Benchmark started');
console.log('Collecting profiles');
collectAndSaveProfiles();
console.log('Done');
