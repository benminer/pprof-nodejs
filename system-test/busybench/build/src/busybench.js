/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { promises } from 'fs';
// eslint-disable-next-line n/no-extraneous-import
import { encode, heap, SourceMapper, time } from 'pprof';
const startTime = Date.now();
const testArr = [];
/**
 * Fills several arrays, then calls itself with setTimeout.
 * It continues to do this until durationSeconds after the startTime.
 */
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
function benchmark(durationSeconds) {
    // Allocate 16 MiB in 64 KiB chunks.
    for (let i = 0; i < 16 * 16; i++) {
        testArr[i] = new Array(64 * 1024);
    }
    busyLoop(durationSeconds);
}
function collectAndSaveTimeProfile(durationSeconds, sourceMapper) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = yield time.profile({
            durationMillis: 1000 * durationSeconds,
            sourceMapper,
        });
        const buf = yield encode(profile);
        yield promises.writeFile('time.pb.gz', buf);
    });
}
function collectAndSaveHeapProfile(sourceMapper) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = yield heap.profile(undefined, sourceMapper);
        const buf = yield encode(profile);
        yield promises.writeFile('heap.pb.gz', buf);
    });
}
function collectAndSaveProfiles() {
    return __awaiter(this, void 0, void 0, function* () {
        const sourceMapper = yield SourceMapper.create([process.cwd()]);
        collectAndSaveTimeProfile(durationSeconds, sourceMapper);
        collectAndSaveHeapProfile(sourceMapper);
    });
}
const durationSeconds = Number(process.argv.length > 2 ? process.argv[2] : 30);
heap.start(512 * 1024, 64);
benchmark(durationSeconds);
collectAndSaveProfiles();
