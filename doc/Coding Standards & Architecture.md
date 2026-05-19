# **Coding Standards & Architecture Guidelines**

To ensure this web-based PCB editor remains highly extensible and performant as we add complex features (Autorouting, DRC, Gerber Export), all code must adhere to the following architectural principles.

## **1\. Mandatory Technology: TypeScript**

For an Electronic Design Automation (EDA) tool, type safety is not optional. Passing a string "10" instead of a number 10 to a Gerber coordinate will result in ruined physical manufacturing.

* **Strict Mode:** TypeScript strict mode must be set to true.  
* **No any:** The use of any is strictly forbidden. Use unknown if absolutely necessary, and narrow the type.  
* **Domain Models:** Define strict interfaces for all PCB entities.

// Example: Strict domain modeling  
type Coordinate \= { x: number; y: number };

interface PCBShape {  
  id: string;  
  layer: 'copper0' | 'copper1' | 'silkscreen';  
  position: Coordinate;  
}

## **2\. Separation of Concerns (UI Agnostic Core)**

The biggest mistake in web editors is mixing business logic with UI components. Your React/Vue components should be "dumb." They only render state and trigger actions.

### **The "Core" Directory Rule**

All math, parsing, and exporting logic must live in a framework-agnostic src/core/ directory.

* **Why?** If you write a Fritzing .fzp parser, it should just be a pure TypeScript function that takes a string and returns a JSON object. It should know nothing about React or the DOM.  
* **Benefit:** This makes the core logic 100% unit-testable in milliseconds using tools like Vitest or Jest.

## **3\. Directory Structure**

Adopt a Domain-Driven or Feature-Based folder structure.

src/  
├── core/                 \# Framework-agnostic business logic  
│   ├── math/             \# Geometry, bounding box calculations, snap-to-grid  
│   ├── parsers/          \# fzz/fzpz ingestion (JSZip, DOMParser wrappers)  
│   ├── exporters/        \# Gerber and Excellon generators  
│   └── types/            \# Global TypeScript definitions  
├── store/                \# Zustand/Pinia state definitions & actions  
├── workers/              \# Web Workers (Autorouter, DRC)  
├── components/           \# UI Components  
│   ├── Canvas/           \# SVG rendering components  
│   ├── Toolbar/          \# Editing tools  
│   └── Modals/           \# Tagging and settings dialogues  
├── utils/                \# Small helper functions (e.g., uid generation)  
└── App.tsx               \# Main entry point

## **4\. Pure Functions for Geometry and Math**

All mathematical operations (converting pixels to mm, calculating trace angles, detecting intersections) must be written as **Pure Functions**.

* A pure function always returns the same output for the same input and has no side effects (it does not modify external state).  
* *Bad:* function movePad() { state.pad.x \+= 10; }  
* *Good:* function calculateNewPosition(current: Coordinate, delta: Coordinate): Coordinate

## **5\. State Immutability**

When updating the central state (especially for Undo/Redo), never mutate objects directly. Always return new object references.

* Use standard spread operators ... or libraries like **Immer** (which integrates beautifully with Zustand/Redux) to handle deep updates safely.

## **6\. Testing Strategy**

* **Unit Tests (Vitest/Jest):** Mandated for everything in src/core/. If someone writes a function that translates an SVG circle to a Gerber D03 flash, there must be a unit test verifying the exact string output.  
* **Integration Tests:** Test the store actions (e.g., calling addPad updates the state correctly).  
* **End-to-End (Playwright/Cypress):** Used sparingly to test critical user flows (e.g., "User can drop a file, drag a pad, and click export").

## **7\. Documentation & Comments**

* **JSDoc:** Every core function must have a JSDoc block explaining its inputs, outputs, and any mathematical assumptions (e.g., / Coordinates must be in millimeters \*/).  
* **Inline Comments:** Explain *why* a piece of code exists, not *what* it does. The code itself should be readable enough to explain the "what."