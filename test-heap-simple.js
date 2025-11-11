// Simple test to isolate heap profiler segfault
console.log('Node version:', process.version);
console.log('Platform:', process.platform, process.arch);

try {
  const bindings = require('./build/node-v137-linux-arm64-glibc/pprof.node');
  console.log('Native bindings loaded successfully');
  console.log('Available methods:', Object.keys(bindings));

  if (bindings.heapProfiler) {
    console.log('Heap profiler methods:', Object.keys(bindings.heapProfiler));
    console.log('Starting heap profiler...');
    bindings.heapProfiler.startSamplingHeapProfiler(512 * 1024, 64);
    console.log('Heap profiler started successfully');

    // Allocate some memory
    const arr = [];
    for (let i = 0; i < 10; i++) {
      arr.push(new Array(1000).fill(i));
    }
    console.log('Memory allocated');

    setTimeout(() => {
      try {
        console.log('Getting allocation profile...');
        const profile = bindings.heapProfiler.getAllocationProfile();
        console.log('Profile collected successfully');
        console.log('Profile type:', typeof profile);
        bindings.heapProfiler.stopSamplingHeapProfiler();
        console.log('Heap profiler stopped');
        process.exit(0);
      } catch (err) {
        console.error('Error in getAllocationProfile:', err);
        process.exit(1);
      }
    }, 100);
  } else {
    console.error('heapProfiler not found in bindings');
    process.exit(1);
  }
} catch (err) {
  console.error('Error:', err);
  console.error(err.stack);
  process.exit(1);
}
