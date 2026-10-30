function s(t,r="products"){return t?t.startsWith("http://")||t.startsWith("https://")||t.startsWith("/storage/")?t:`/storage/${r}/${t}`:null}function u(t){return s(t,"products")}export{u as g};
