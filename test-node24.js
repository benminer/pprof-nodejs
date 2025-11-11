const pprof = require('./out/src/index.js');

console.log('Testing heap profiler on Node 24...');
try {
  pprof.heap.start(512 * 1024, 64);
  console.log('Heap profiler started successfully');

  // Allocate some memory
  const arr = [];
  for (let i = 0; i < 100; i++) {
    arr.push(new Array(1000).fill(i));
  }

  setTimeout(() => {
    console.log('Getting heap profile...');
    try {
      const profile = pprof.heap.profile();
      console.log('Heap profile collected successfully');
      console.log('Profile:', JSON.stringify(profile, null, 2).substring(0, 500));
      process.exit(0);
    } catch (err) {
      console.error('Error collecting heap profile:', err);
      console.error(err.stack);
      process.exit(1);
    }
  }, 100);
} catch (err) {
  console.error('Error starting heap profiler:', err);
  process.exit(1);
}
