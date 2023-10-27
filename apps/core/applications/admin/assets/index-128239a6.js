import{c as e,u as t,a,g as n,b as l,i,R as r,_ as o,m as s,d as c,e as u,f as d,s as p,h as m,j as f,k as h,l as v,n as b,L as x,E as N,o as g,A as y}from"./index-da778430.js";function z(c){var u=c.children,d=c.className,p=c.color,m=c.content,f=c.horizontal,h=c.inverted,v=c.items,b=c.size,x=c.widths,N=e("ui",p,b,a(f,"horizontal"),a(h,"inverted"),t(x),"statistics",d),g=n(z,c),y=l(z,c);return i(u)?i(m)?r.createElement(y,o({},g,{className:N}),s(v,(function(e){return w.create(e)}))):r.createElement(y,o({},g,{className:N}),m):r.createElement(y,o({},g,{className:N}),u)}function E(t){var a=t.children,s=t.className,c=t.content,u=e("label",s),d=n(E,t),p=l(E,t);return r.createElement(p,o({},d,{className:u}),i(a)?c:a)}function C(t){var s=t.children,c=t.className,u=t.content,d=t.text,p=e(a(d,"text"),"value",c),m=n(C,t),f=l(C,t);return r.createElement(f,o({},m,{className:p}),i(s)?u:s)}function w(t){var s=t.children,c=t.className,d=t.color,p=t.content,m=t.floated,f=t.horizontal,h=t.inverted,v=t.label,b=t.size,x=t.text,N=t.value,g=e("ui",d,b,u(m,"floated"),a(f,"horizontal"),a(h,"inverted"),"statistic",c),y=n(w,t),z=l(w,t);return i(s)?i(p)?r.createElement(z,o({},y,{className:g}),C.create(N,{defaultProps:{text:x},autoGenerateKey:!1}),E.create(v,{autoGenerateKey:!1})):r.createElement(z,o({},y,{className:g}),p):r.createElement(z,o({},y,{className:g}),s)}z.handledProps=["as","children","className","color","content","horizontal","inverted","items","size","widths"],z.propTypes={},E.handledProps=["as","children","className","content"],E.propTypes={},E.create=c(E,(function(e){return{content:e}})),C.handledProps=["as","children","className","content","text"],C.propTypes={},C.create=c(C,(function(e){return{content:e}})),w.handledProps=["as","children","className","color","content","floated","horizontal","inverted","label","size","text","value"],w.propTypes={},w.Group=z,w.Label=E,w.Value=C,w.create=c(w,(function(e){return{content:e}}));const T=d`
    query GET_STATS {
        libraries(pagination: {offset: 0, limit: 1}) {
            totalCount
        }
        attributes(pagination: {offset: 0, limit: 1}) {
            totalCount
        }
        trees(pagination: {offset: 0, limit: 1}) {
            totalCount
        }
        applications(pagination: {offset: 0, limit: 1}) {
            totalCount
        }
    }
`,j=p(w.Group)`
    && {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-direction: row;
        flex-wrap: wrap;
        margin: 0;
        ::after {
            content: none;
        }
    }
`,G=p(w)`
    &&&& {
        border: 1px solid #ccc;
        padding: 1rem;
        width: 13rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 1rem;
        cursor: pointer;
        box-shadow: 1px 1px 4px #ccc;
        margin: 0;
    }
`,P=p(w.Label)`
    &&&&& {
        text-transform: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;function L(){var e,t,a,n;const{loading:l,error:i,data:r}=m(T),{t:o}=f(),s=h({size:"small"}),c=v(),u=s.reduce(((e,t)=>(e[t.id]=t,e)),{});if(l)return b(x,{});if(i)return b(N,{});const d=[{label:o("libraries.title"),route:"libraries",value:(null==(e=null==r?void 0:r.libraries)?void 0:e.totalCount)??0,icon:u.libraries.icon},{label:o("attributes.title"),route:"attributes",value:(null==(t=null==r?void 0:r.attributes)?void 0:t.totalCount)??0,icon:u.attributes.icon},{label:o("trees.title"),route:"trees",value:(null==(a=null==r?void 0:r.trees)?void 0:a.totalCount)??0,icon:u.trees.icon},{label:o("applications.title"),route:"applications",value:(null==(n=null==r?void 0:r.applications)?void 0:n.totalCount)??0,icon:u.applications.icon}];return b(j,{children:d.map((e=>{return g(G,{onClick:(t=e.route,()=>{c.push(`/${t}`)}),title:e.label,children:[g(P,{children:[e.icon," ",e.label]}),b(w.Value,{children:e.value})]},e.label);var t}))})}const k=p.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5rem;
`,A=p.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;function K(){const{t:e}=f();return g(k,{children:[g(A,{children:[b("h3",{className:"title",children:e("dashboard.title")}),b(y,{size:"small"})]}),b(L,{})]})}export{K as default};
