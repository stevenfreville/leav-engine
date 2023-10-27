import{s as e,j as a,R as n,o as r,F as i,n as l,q as o,B as s,I as t,h as c,bO as d,L as b,E as m}from"./index-da778430.js";import{g as u}from"./getLibrariesQuery-8f805ce0.js";import{E as h}from"./DefinePermByUserGroupView-a11a63fc.js";import{C as f}from"./Header-90427ac0.js";const g=e.div`
    display: flex;
    height: 3rem;

    && .buttons {
        display: none;
    }

    &:hover .buttons {
        display: block;
    }

    > * {
        margin-right: 1em;
    }
`;function p({onChange:e,label:c,value:d,disabled:b,libraries:m,required:u=!1}){const{t:p}=a(),[v,C]=n.useState(!1),[y,x]=n.useState(!1),_=()=>x(!1),j=()=>{C(!0)};return r(i,{children:[l("label",{children:c}),r(g,{children:[d&&r(i,{children:[l(o,{record:d}),!b&&r(s.Group,{basic:!0,children:[l(s,{type:"button",icon:!0,onClick:j,title:"exchange","aria-label":"exchange",name:"exchange",children:l(t,{name:"exchange"})}),!u&&l(s,{type:"button",icon:!0,onClick:()=>x(!0),"aria-label":"delete",children:l(t,{name:"close"})})]})]}),!d&&r(s,{type:"button",icon:!0,labelPosition:"left",onClick:j,children:[l(t,{name:"search"}),p("record_selector.select")]})]}),v&&l(h,{library:m,open:v,onClose:()=>C(!1),onSelect:a=>{e(a),C(!1)}}),y&&l(f,{open:y,onCancel:_,onConfirm:()=>{e(null),_()},content:p("record_selector.delete_confirm"),confirmButton:p("admin.submit"),cancelButton:p("admin.cancel")})]})}function v({label:e,value:n,onChange:r,disabled:i}){var o;const{t:s}=a(),{loading:t,error:h,data:f}=c(u,{variables:{behavior:[d.files]}});if(t)return l(b,{});if(h)return l(m,{message:h.message});const g=(null==(o=null==f?void 0:f.libraries)?void 0:o.list)??[];return g.length?l(p,{label:e,value:n,onChange:r,disabled:i,libraries:g.map((e=>e.id))}):l(m,{message:s("file_selector.no_files_libraries")})}export{v as F,p as R};
