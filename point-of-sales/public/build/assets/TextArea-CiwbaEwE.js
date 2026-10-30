import{j as e}from"./app-DFScJlNe.js";function n({label:t,className:r,errors:a,rows:s=4,...l}){return e.jsxs("div",{className:"flex flex-col gap-2",children:[t&&e.jsx("label",{className:"text-sm font-medium text-slate-700 dark:text-slate-300",children:t}),e.jsx("textarea",{rows:s,className:`
                    w-full px-4 py-3 text-sm rounded-xl
                    border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800
                    text-slate-800 dark:text-slate-200
                    placeholder-slate-400 dark:placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                    transition-all duration-200 resize-none
                    ${a?"border-danger-500 focus:border-danger-500 focus:ring-danger-500/20":""}
                    ${r||""}
                `,...l}),a&&e.jsx("small",{className:"text-xs text-danger-500 dark:text-danger-400",children:a})]})}export{n as T};
