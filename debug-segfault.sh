#!/bin/bash
set -ex

# Build a minimal test inside Docker to isolate the segfault
cat > /tmp/minimal-test.js <<'EOF'
console.log('Node version:', process.version);
console.log('V8 version:', process.versions.v8);

try {
  const pprof = require('/cloned_src/out/src/index.js');
  console.log('pprof loaded successfully');

  // Test heap profiler
  console.log('Starting heap profiler...');
  pprof.heap.start(512 * 1024, 64);
  console.log('Heap profiler started');

  // Allocate some memory
  const arr = [];
  for (let i = 0; i < 10; i++) {
    arr.push(new Array(1000).fill(i));
  }
  console.log('Memory allocated');

  setTimeout(() => {
    console.log('Getting heap profile...');
    const profile = pprof.heap.profile();
    console.log('Heap profile OK');

    // Now test time profiler using profile API
    console.log('Testing time profiler...');
    pprof.time.profile({durationMillis: 100}).then(profile => {
      console.log('Time profile OK');
      console.log('All tests passed!');
      process.exit(0);
    }).catch(err => {
      console.error('Time profiler error:', err);
      process.exit(1);
    });
  }, 100);
} catch (err) {
  console.error('Error:', err);
  console.error(err.stack);
  process.exit(1);
}
EOF

docker run -v $PWD:/src -v /tmp/minimal-test.js:/tmp/minimal-test.js node24-linux bash -c "
  set -ex
  cp -r /src /cloned_src
  cd /cloned_src
  npm install --quiet
  npm run compile
  node /tmp/minimal-test.js
"
