#!/bin/bash
set -ex

# Test with a busybench-like workload
cat > /tmp/busybench-test.js <<'EOF'
const pprof = require('/cloned_src/out/src/index.js');

console.log('Node version:', process.version);

const startTime = Date.now();
const testArr = [];

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
  // Allocate 16 MiB in 64 KiB chunks
  for (let i = 0; i < 16 * 16; i++) {
    testArr[i] = new Array(64 * 1024);
  }
  busyLoop(durationSeconds);
}

async function test() {
  console.log('Starting heap profiler...');
  pprof.heap.start(512 * 1024, 64);

  console.log('Starting benchmark...');
  benchmark(1);  // Short duration

  setTimeout(async () => {
    console.log('Creating SourceMapper...');
    const SourceMapper = pprof.SourceMapper;
    const sourceMapper = await SourceMapper.create([process.cwd()]);
    console.log('SourceMapper created');

    console.log('Collecting time profile...');
    const profile = await pprof.time.profile({
      durationMillis: 100,
      sourceMapper
    });
    console.log('Time profile collected');

    console.log('Collecting heap profile...');
    const heapProfile = await pprof.heap.profile(undefined, sourceMapper);
    console.log('Heap profile collected');

    console.log('All tests passed!');
    process.exit(0);
  }, 1500);
}

test().catch(err => {
  console.error('Error:', err);
  console.error(err.stack);
  process.exit(1);
});
EOF

docker run -v $PWD:/src -v /tmp/busybench-test.js:/tmp/busybench-test.js node24-linux bash -c "
  set -ex
  cp -r /src /cloned_src
  cd /cloned_src
  npm install --quiet 2>&1 | grep -v 'npm warn' || true
  npm run compile --quiet
  timeout 10 node /tmp/busybench-test.js || echo 'Exit code:' \$?
"
