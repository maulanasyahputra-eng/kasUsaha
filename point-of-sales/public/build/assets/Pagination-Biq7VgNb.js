import{j as e,L as a}from"./app-DFScJlNe.js";import{c as n}from"./createReactComponent-BRxLRYEh.js";/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["path",{d:"M15 6l-6 6l6 6",key:"svg-0"}]],d=n("outline","chevron-left","ChevronLeft",l);/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M9 6l6 6l-6 6",key:"svg-0"}]],c=n("outline","chevron-right","ChevronRight",g);function x({links:s}){const o="p-1 text-sm border rounded-md bg-white text-gray-500 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:border-gray-900";return e.jsx(e.Fragment,{children:e.jsx("ul",{className:"mt-2 lg:mt-5 justify-end flex items-center gap-1",children:s.map((r,t)=>r.url!=null?r.label.includes("Previous")?e.jsx(a,{className:o,href:r.url,children:e.jsx(d,{size:"20",strokeWidth:"1.5"})},t):r.label.includes("Next")?e.jsx(a,{className:o,href:r.url,children:e.jsx(c,{size:"20",strokeWidth:"1.5"})},t):e.jsx(a,{className:`px-2 py-1 text-sm border  rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900 dark:border-gray-900 ${r.active?"bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-50":"bg-white dark:bg-gray-950"}`,href:r.url,children:r.label},t):null)})})}export{x as P};
