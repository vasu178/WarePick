/**
 * Simple Promise-based Mutex to serialize task assignments
 * and prevent race conditions when finding idle bots or queued tasks.
 */
let locked = false;
const queue = [];

async function acquireLock() {
  return new Promise((resolve) => {
    if (!locked) {
      locked = true;
      resolve();
    } else {
      queue.push(resolve);
    }
  });
}

function releaseLock() {
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  } else {
    locked = false;
  }
}

module.exports = { acquireLock, releaseLock };
