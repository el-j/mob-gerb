# **Feature 1: The SVG Footprint Creator**

**Goal:** A mobile-friendly canvas where users can draw basic shapes, assign them Fritzing PCB roles (Pads, Silkscreen), and export a valid .fzp structure.

## **1\. The Coordinate System (The Most Important Step)**

Before drawing anything, you must lock down how the SVG space translates to real-world physics. Do not use random pixel values.

* **The Standard:** Map 1 SVG unit to 1 millimeter (or 0.1mm for higher precision without decimals).  
* **The Canvas:** \<svg viewBox="0 0 100 100"\> (This creates a 100mm x 100mm workspace).  
* **Grid Snapping:** Implement a background grid pattern (e.g., lines every 2.54mm to match standard breadboard/header pitch).

## **2\. React/Vue State Structure**

Your UI must be driven by a central state object, NOT by manually manipulating the DOM.

// Example Initial State  
const footprintState \= {  
  metadata: { name: "New Part", author: "" },  
  elements: \[  
    { id: "shape\_1", type: "circle", cx: 10, cy: 10, r: 1.5, role: "unassigned" },  
    { id: "shape\_2", type: "line", x1: 0, y1: 0, x2: 20, y2: 0, role: "unassigned" }  
  \]  
}

## **3\. The Mobile UX Flow**

1. **Add Shape:** User taps an "Add Pad (Circle)" button. The shape appears in the center of the viewport.  
2. **Move Shape:** 1-finger drag moves the shape. Your touch listener intercepts the coordinates, applies Math.round() based on your 2.54mm grid, and updates the state.  
3. **The Tagging Drawer:** User taps the shape. A mobile bottom-sheet slides up asking: *What is this?*  
   * Option A: "Through-Hole Pad" (Requires user to type a Pin Number, e.g., "1").  
   * Option B: "SMD Pad" (Top copper only).  
   * Option C: "Silkscreen" (Visual outline).  
4. **State Update:** If they choose "Through-Hole Pad 1", you update shape\_1.role to connector1pin.

## **4\. The Rendering Engine (SVG Output)**

Your framework maps the footprintState directly into Fritzing's expected nested \<g\> structure.

\<svg viewBox="0 0 100 100"\>  
  {/\* Copper Layers \*/}  
  \<g id="copper1"\>  
    \<g id="copper0"\>  
       {state.elements  
         .filter(e \=\> e.role.includes('connector'))  
         .map(pad \=\> (  
           \<circle key={pad.id} id={pad.role} cx={pad.cx} cy={pad.cy} r={pad.r} fill="none" stroke="\#F7BD13" strokeWidth="0.5"/\>  
       ))}  
    \</g\>  
  \</g\>  
    
  {/\* Silkscreen Layer \*/}  
  \<g id="silkscreen"\>  
      {/\* Map silkscreen elements here... \*/}  
  \</g\>  
\</svg\>

## **5\. The FZP Compiler**

Once the user is done, write a pure JavaScript function that loops through footprintState.elements and generates the corresponding .fzp XML string.

* It looks for all elements assigned as connectors.  
* It generates the \<connector id="connectorX" ...\> XML block for each.  
* It grabs the actual rendered SVG string using ref.current.innerHTML.  
* Finally, it zips them together using JSZip for download.