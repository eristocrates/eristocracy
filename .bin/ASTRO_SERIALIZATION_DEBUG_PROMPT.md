# Astro Function Serialization Debug Prompt

## Context: Kapsule Component System Implementation

We're implementing a modular Kapsule wrapper system in Astro where:

1. **KapsuleConfigs.js** defines component configurations with `init` and `update` functions:

```javascript
export const KapsuleConfigs = {
  ColoredText: {
    props: { color: { default: "red" }, text: { default: "" } },
    init: function (domElement, state) {
      state.elem = document.createElement("span");
      domElement.appendChild(state.elem);
    },
    update: function (state) {
      state.elem.style.color = state.color;
      state.elem.textContent = state.text;
    },
  },
};
```

2. **ColoredText.astro** spreads the config into KapsuleWrapper:

```astro
const config = KapsuleConfigs.ColoredText;
// ...
<KapsuleWrapper {...config} color={color} text={text} />
```

3. **KapsuleWrapper.astro** extracts functions and passes them via `define:vars`:

```astro
const { init, update, /* other props */ } = Astro.props;
// ...
if (init) complexFiltered.init = init;
if (update) complexFiltered.update = update;
// ...
<script type="module" define:vars={complexFiltered}>
  // Functions should be available here but show as "undefined" strings
</script>
```

## The Problem

**Expected**: Functions are available in the client script as actual functions
**Actual**: Functions appear as the string `"undefined"` in client console logs
**Evidence**: Console shows `init: "undefined", update: "undefined"` instead of `init: function, update: function`

## Critical Questions for Investigation

### 1. **Astro `define:vars` Function Serialization**

- Does Astro's `define:vars` support function serialization at all?
- Are functions JSON-serialized, and if so, do they become strings or are they lost?
- What is the canonical Astro pattern for passing functions from server to client?

### 2. **Alternative Astro Patterns**

- Should functions be defined directly in the client script rather than passed via `define:vars`?
- Is there an Astro-native way to handle component lifecycle functions like Kapsule's `init/update`?
- Should we use Astro's component script vs. inline script patterns differently?

### 3. **Timing and Module Resolution**

- Why does the entire Kapsule initialization complete before Vite connects?
- Is this a module resolution timing issue where imported functions aren't ready?
- Should we use dynamic imports or different script loading strategies?

### 4. **Recommended Architecture**

Given Astro's constraints and patterns:

- What's the proper way to implement a component wrapper system that needs lifecycle functions?
- Should we abandon `define:vars` for functions and use a different approach?
- Is there a better Astro pattern for this modular component wrapper use case?

## Specific Technical Investigation Needed

1. **Test function serialization**: Create minimal reproduction of function passing via `define:vars`
2. **Document Astro limitations**: What can/cannot be serialized through `define:vars`?
3. **Identify workarounds**: How do other Astro component libraries handle lifecycle functions?
4. **Propose solution**: What's the cleanest Astro-native approach for our Kapsule wrapper system?

## Expected Outcome

A clear understanding of:

- Whether our current approach is fundamentally incompatible with Astro
- The correct Astro pattern for component wrapper systems with lifecycle functions
- A working solution that maintains our modular architecture while respecting Astro's constraints

## Current System Status

✅ Props extraction and categorization working
✅ Kapsule instance creation working  
✅ Method chaining (`.color().text()`) working
❌ Lifecycle functions (`init`, `update`) not reaching client script
❌ No DOM manipulation happening (no visible output)
