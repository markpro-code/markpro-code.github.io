# How to Make A Simple AMD Loader

## Table of Contents

-   [AMD API](#amd-api)
-   [Loading Script](#loading-script)
    -   [load by <script> tag](#load-by-script-tag)
    -   [load by ajax request](#load-by-ajax-request)

## AMD API

according to [AMD API](https://github.com/amdjs/amdjs-api/wiki/AMD), AMD system must have a global `define()` function, and `define.amd` must be an object:

    define(id?, dependencies?, factory);

parameters:
1\. `id`: a string literal specifies the id of the module being defined
2\. `dependencies`: an array literal of the module ids that are dependencies
3\. `factory`: function that should be executed to instantiate the module

simple define() implementation:

```javascript
const define = function(id, deps, factory) {
    if (typeof id !== 'string') {
        factory = deps
        deps = id
        id = null
    }

    if (!isArray(deps)) {
        factory = deps
        deps = null
    }

    const module = factory()
    // save module to somewhere
    define.__currentModule = module
}

define.amd = {}
window.define = define
```

## Loading Script

Generally speaking, there are two ways to load a script:
1\. load by generate a script tag and assign `src` attribute
1\. load script code by ajax request and then eval the code

### load by <script> tag

```javascript
export function loadScript(url) {
    return new Promise(function(resolve, reject) {
        const scriptElement = document.createElement('script')
        scriptElement.async = true
        scriptElement.onload = function(event) {
            const module
            // get module ...
            resolve(module)
        }
        scriptElement.onerror = function(error) {
            reject(error)
        }
        scriptElement.src = url
        document.body.appendChild(scriptElement)
    })
}
```

after the script element assigned with `src` value and insert into DOM, the script element will start loading code.

the problem of the approach is that get the module instance form the onload event handler is tricky, [Document.currentScript](https://developer.mozilla.org/en-US/docs/Web/API/Document/currentScript) may helps, but not support by IE 11 and previous version. Library like requirejs spend a lot of code to conquer this problem.

### load by ajax request

```javascript
function loadScript(url) {
    return axios.get(url).then(response => {
        /* eslint-disable */
        const run = new Function(`${response.data}; return define.__currentModule;`)
        /* eslint-enable */
        return run()
    })
}
```

load script by ajax request is much simple, you just need to execute script inside function constructor, which runs in global scope and return the module instance.
