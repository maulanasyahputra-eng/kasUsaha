import{c as s}from"./createReactComponent-BRxLRYEh.js";import{a as c}from"./app-DFScJlNe.js";/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["path",{d:"M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5",key:"svg-0"}],["path",{d:"M12 12l8 -4.5",key:"svg-1"}],["path",{d:"M12 12l0 9",key:"svg-2"}],["path",{d:"M12 12l-8 -4.5",key:"svg-3"}],["path",{d:"M16 5.25l-8 4.5",key:"svg-4"}]],A=s("outline","package","Package",i);function o(e={}){return{permissions:(e==null?void 0:e.permissions)??{},super:(e==null?void 0:e.super)===!0}}function l(e={}){return o(e).super}function t(e,n={}){var a;const r=o(n);return r.super||((a=r.permissions)==null?void 0:a[e])===!0}function u(e=[],n={}){return!Array.isArray(e)||e.length===0?!1:e.some(r=>t(r,n))}function p(e=[],n={}){return!Array.isArray(e)||e.length===0?!1:e.every(r=>t(r,n))}function g(){const{auth:e}=c().props;return{auth:e,can:n=>t(n,e),canAny:n=>u(n,e),canAll:n=>p(n,e),isSuperAdmin:()=>l(e)}}export{A as I,l as i,g as u};
