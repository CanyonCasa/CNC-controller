
function getNested(obj, path, defaultValue) {
  // Split the path string by the dot delimiter to get individual keys
  const keys = path.split('.');

  // Use reduce() to traverse the object
  const result = keys.reduce((currentObj, key) => {
    // If the current object is null or undefined, stop and return undefined
    // (This handles cases where an intermediate level doesn't exist, preventing errors)
    if (currentObj === null || typeof currentObj === 'undefined') {
      return undefined;
    }
    // Return the next level in the object using bracket notation
    return currentObj[key];
  }, obj); // Start with the initial object

  // Return the result if it's not undefined, otherwise return the default value
  return result === undefined ? defaultValue : result;
}

/**
 * Dynamically sets a nested property in an object.
 * 
 * @param {object} obj - The target object.
 * @param {Array<string|number>} path - The path to the property as an array of keys.
 * @param {*} value - The value to set.
 */
function setNestedProperty(obj, path, value) {
    let current = obj;
    // Iterate over the path up to the second-to-last key
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        // If the current property doesn't exist, create an empty object
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        // Move deeper into the object
        current = current[key];
    }
    // Set the final property value using the last key
    current[path[path.length - 1]] = value;
}

function setNested(obj, path, value) {
    let currentObj = obj;
    let keys = path.split('.');
    let key = keys.pop();
    let fix = (obj, k) => obj[k]===undefined ? obj[k]={} : obj[k];
    keys.forEach(k=>{ currentObj = fix(currentObj, k); });
    currentObj[key] = value;
}

this.state = { spindle: 'OFF', speed: 0 };
console.log('state:', this.state);

setNested(this, 'state.speed',5000);
console.log('state:', this.state);

setNested(this, 'state.direction','CW');
console.log('state:', this.state);

setNested(this, 'state.test.test','test');
console.log('state:', this.state);
