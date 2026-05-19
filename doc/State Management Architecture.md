# **State Management & Persistence Strategy**

To ensure a seamless, "native app" feel on the web, the state management must handle continuous auto-saving, undo/redo stacks, and highly performant UI updates without freezing the SVG canvas.

## **1\. The Recommended Stack**

For a React-based implementation, **Zustand** is highly recommended over Redux or Context API.

For a Vue-based implementation, **Pinia** is the standard.

* **Why Zustand/Pinia?** They allow for "transient updates." When a user is dragging a pad across the screen, you don't want to trigger a full React component tree re-render on every pixel movement. Zustand allows you to bind the X/Y coordinates directly to the SVG node for 60fps dragging, and only commit the final position to the main "Saved" state when the user lifts their finger.

## **2\. The Persistence Layer (Auto-Save)**

localStorage is too small (usually a 5MB limit) and synchronous (it blocks the main thread, causing stuttering). For a PCB editor that might store complex SVGs and multiple Fritzing part objects, you must use **IndexedDB**.

* **Library:** Use a wrapper like **localforage** or **idb**.  
* **The Workflow:**  
  1. Every time the user adds a shape, changes a route, or tags a pad, the central State Object updates.  
  2. A debounced function (e.g., waiting 1 second after the last action) triggers.  
  3. The app serializes the current state and saves it asynchronously to IndexedDB in the background.  
  4. **Resume:** When the user opens the URL again, the useEffect / onMounted hook checks IndexedDB. If a draft exists, it instantly loads it into the state, bypassing the start screen.

## **3\. The Undo / Redo Engine**

Nothing ruins the UX of an editor faster than not being able to undo a mistake.

Because your state is a centralized JSON object, implementing Undo/Redo is mathematically straightforward using a "History Stack" pattern.

// Example History State Structure  
const appState \= {  
  past: \[\], // Array of previous states  
  present: { // The active canvas  
    metadata: { name: "My Footprint" },  
    elements: \[ ... \]  
  },  
  future: \[\], // Array of undone states (for Redo)  
}

* **How it works:** When a user commits a major action (e.g., dropping a new pad, deleting a line), you push a deep clone of the *current* present state into the past array, then update present.  
* **Memory Limit:** To prevent mobile browsers from crashing due to memory limits, cap the past array to the last 20-30 actions.

## **4\. Structuring the State for Serialization**

To make saving and loading flawless, keep your state "flat" and avoid storing actual DOM elements or functions in the state. Store only pure data.

// The Golden Rule: The state should look like a database schema.  
type ElementState \= {  
  id: string;          // e.g., "pad-123"  
  type: 'rect' | 'circle' | 'line';  
  role: 'connector' | 'silkscreen' | 'unassigned';  
  pcbLayer: 'copper0' | 'copper1' | 'silkscreen';  
  geom: {              // All physical properties in mm  
    x: number; y: number; w?: number; h?: number; r?: number;  
  };  
  net?: string;        // Used later for routing  
}

type FootprintProject \= {  
  projectId: string;  
  lastModified: number; // Unix timestamp  
  gridSize: number;     // e.g., 2.54  
  elements: Record\<string, ElementState\>; // Use an object map for instant O(1) lookups  
}

## **5\. Exporting as a "Project File"**

In addition to the .fzpz (which is the final Fritzing format), you should allow users to download their raw IndexedDB state as a custom .json or .pcb-draft file. This acts as a manual hard backup that they can email to themselves or share with collaborators.