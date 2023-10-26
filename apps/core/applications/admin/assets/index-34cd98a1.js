import{N as t,j as e,bs as i,v as a,n as s,F as r,s as l,w as d,t as n,h as o,K as m,o as u,d7 as c,P as b,B as p,cb as f,I as h}from"./index-da778430.js";import{u as g,G as A,H as j}from"./Header-90427ac0.js";import{g as v}from"./getAttributesQuery-614214c0.js";import{A as x}from"./AttributesList-dc843b21.js";import{C as y,D as I}from"./DeleteButton-48c58b6e.js";import"./Input-94df8f06.js";import"./Checkbox-69de3138.js";import"./Dropdown-4600c907.js";const _=t`
    mutation DELETE_ATTRIBUTE($attrId: ID!) {
        deleteAttribute(id: $attrId) {
            id
        }
    }
`,w=t=>{const{attribute:l,filters:d}=t,{t:n}=e();i();const[o]=g(_,{update:(t,{data:{deleteAttribute:e}})=>{a(t,e)}}),m=null!==l.label&&(l.label.fr||l.label.en)||l.id;return l?s(y,{action:async()=>o({variables:{attrId:l.id}}),confirmMessage:n("attributes.confirm_delete",{attrLabel:m}),children:s(I,{disabled:l.system})}):s(r,{})},k=l(j)`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`,C=t=>{const{t:i}=e(),{history:a}=t,[l,g]=d.useState({}),j=n(),{loading:y,error:I,data:_}=o(v,{variables:{...m(l)}});return u("div",{children:[u(A,{children:[s(A.Column,{textAlign:"left",floated:"left",width:8,verticalAlign:"middle",children:u(k,{size:"large",children:[s(c,{size:30}),i("attributes.title")]})}),j.permissions[b.admin_create_attribute]&&s(A.Column,{floated:"right",width:6,textAlign:"right",verticalAlign:"middle",children:u(p,{primary:!0,icon:!0,labelPosition:"left",size:"medium",as:f,to:"/attributes/edit/",children:[s(h,{name:"plus"}),i("attributes.new")]})})]}),I?u("p",{children:["Error: ",I.message]}):s(x,{loading:y||!_,attributes:_&&_.attributes?_.attributes.list:[],onRowClick:t=>a.push("/attributes/edit/"+t.id),onFiltersUpdate:t=>{const e="checkbox"===t.type?t.indeterminate?void 0:t.checked:t.value;g({...l,[t.name]:e})},filters:l,actions:j.permissions[b.admin_delete_attribute]?s(w,{filters:l},"delete_attr"):s(r,{})})]})};export{C as default};
