import{N as e,s as r,I as i,j as l,o as a,F as t,n,B as s,da as o,bs as d,cA as c,z as m,y as b,db as u,cy as p,G as h,l as y,cz as g,dc as f,dd as v,de as w,cH as _,cK as x,cL as C,df as I,bt as k,p as O,w as P,cG as A,dg as S,S as D,t as T,h as j,L as R,P as N}from"./index-da778430.js";import{F as $,a as M,b as z,D as E,d as L,u as B,T as F,c as G}from"./DefinePermByUserGroupView-a11a63fc.js";import{G as V,u as Q,H as q}from"./Header-90427ac0.js";import{S as H,T as U}from"./Tab-13a14f2c.js";import{g as K}from"./getTreesQuery-8499c1fa.js";import{o as J}from"./omit-793fed5e.js";import{C as W}from"./Checkbox-69de3138.js";import{L as X,u as Y,_ as Z,P as ee,D as re}from"./DefineTreePermissionsView-c97777f8.js";import"./Dropdown-4600c907.js";import"./Input-94df8f06.js";import"./_baseClone-266ca0ea.js";import"./getLibrariesQuery-8f805ce0.js";import"./Popup-65e7a174.js";import"./getAttributesQuery-614214c0.js";const ie=e`
    mutation SAVE_TREE($treeData: TreeInput!) {
        saveTree(tree: $treeData) {
            id
            system
            label
            behavior
            libraries {
                library {
                    id
                    label
                    attributes {
                        id
                        label
                        type
                        ... on TreeAttribute {
                            linked_tree {
                                id
                            }
                        }
                    }
                }
                settings {
                    allowMultiplePositions
                    allowedAtRoot
                    allowedChildren
                }
            }
            permissions_conf {
                libraryId
                permissionsConf {
                    permissionTreeAttributes {
                        id
                        label
                    }
                    relation
                }
            }
        }
    }
`,le=r.label`
    font-weight: 700;
`,ae=r(i)`
    cursor: pointer;
`;function te({onChange:e,libraries:r,readonly:o}){const{t:d}=l(),c=i=>(l,a)=>{let t=a.value;"checkbox"===a.type?t="allowedChildren"===a.name?a.checked?["__all__"]:[]:a.checked:"allowedChildren"!==a.name||a.value.length||(t=["__all__"]);const n=r;n[i].settings={...n[i].settings,[a.name]:t},e(n)},m=i=>(l,a)=>{const t=r;t[i].library=a.value,e(t)},b=i=>()=>{const l=[...r];e([...l.splice(0,i),...l.splice(i+1)])};return a(t,{children:[a(V,{children:[n(V.Column,{textAlign:"left",floated:"left",width:8,verticalAlign:"middle",children:n(le,{children:d("trees.libraries")})}),!o&&n(V.Column,{floated:"right",width:8,textAlign:"right",verticalAlign:"middle",children:a(s,{"data-test-id":"add-button",type:"button",icon:!0,labelPosition:"left",size:"small",onClick:()=>{e([...r,{library:"",settings:{allowMultiplePositions:!1,allowedAtRoot:!0,allowedChildren:["__all__"]}}])},children:[n(i,{name:"plus"}),d("trees.add_library")]})})]}),r.map(((e,r)=>n(H,{children:n(V,{columns:3,stackable:!0,children:a(V.Row,{verticalAlign:"middle",children:[n(V.Column,{width:4,children:n(X,{"data-test-id":"lib-selector",disabled:o,multiple:!1,fluid:!0,selection:!0,name:"libraries",onChange:m(r),value:e.library})}),n(V.Column,{width:11,textAlign:"right",children:n(V,{columns:1,stackable:!0,children:n(V.Row,{verticalAlign:"middle",children:n(V.Column,{textAlign:"left",children:n(W,{"data-test-id":`settings-allowMultiplePositions-${e.library}`,toggle:!0,name:"allowMultiplePositions",checked:e.settings.allowMultiplePositions,label:d("trees.allow_multiple_positions"),onChange:c(r),disabled:o})})})})}),!o&&n(V.Column,{width:1,textAlign:"right",children:n(ae,{"data-test-id":"delete-button",name:"cancel",onClick:b(r)})})]})})},r)))]})}const ne=r($.Group)`
    margin-top: 10px;
`,se=({tree:e,onSubmit:r,readonly:i,errors:t,onCheckIdExists:s})=>{const{t:y}=l(),g={id:"",label:{fr:"",en:""},behavior:o.standard,system:!1,permissions_conf:null,libraries:[]},f=null===e?g:{...e,libraries:e.libraries.map((e=>({library:e.library.id,settings:J(e.settings,["__typename"])})))},v=null!==e,{lang:w,defaultLang:_,availableLangs:x}=d(),C=t&&t.extensions.code===c.VALIDATION_ERROR?t.extensions.fields:{};let I=m().required().matches(/^[a-z0-9_]+$/);v||(I=I.test("isIdUnique",y("admin.validation_errors.id_exists"),s));const k=b().shape({label:b().shape({[_||x[0]]:m().required()}),id:I,libraries:u(b().shape({library:m(),settings:b()}))}),O=Object.values(o).map((e=>({key:e,value:e,text:y(`trees.behavior_${e}`)})));return n(M,{initialValues:f,onSubmit:e=>{r(e)},render:({handleSubmit:e,handleBlur:r,setFieldValue:l,errors:t,values:s,touched:o})=>{const d=(e,r)=>{c(e,r);const{name:i,value:a}=r,[t,n]=i.split(".");v||"label"!==t||n!==_||l("id",p(a))},c=(e,r)=>{const i="checkbox"===r.type?r.checked:r.value,a=r.name;l(a,i)},{id:m,label:b,libraries:u,system:g,behavior:f}=s,w=e=>h(e,o,C||{},t);return a($,{onSubmit:e,children:[a($.Group,{grouped:!0,children:[n("label",{children:y("trees.label")}),x.map((e=>n(z,{error:w(`label.${e}`),children:n($.Input,{label:`${e} ${e===_?"*":""}`,width:"4",name:"label."+e,disabled:i,value:b&&b[e]?b[e]:"",onChange:d})},e)))]}),n(z,{error:w("id"),children:n($.Input,{label:y("trees.ID"),width:"4",disabled:v||i,name:"id",onChange:c,onBlur:r,value:m})}),n(z,{error:w("behavior"),children:n($.Select,{label:y("trees.behavior"),disabled:!0,name:"behavior",onChange:c,onBlur:r,value:f,options:O})}),n(z,{error:w("libraries"),children:n(te,{libraries:u,onChange:e=>{l("libraries",e)},readonly:g||i})}),!i&&n(ne,{children:n($.Button,{type:"submit",children:y("admin.submit")})})]})},validationSchema:k})};function oe({tree:e,readonly:r}){const i=y(),l=!e,[a]=Q(ie,{update:async r=>{e||g(r,"trees")}}),[t,{data:s}]=Y(K,{fetchPolicy:"no-cache"});return n(se,{tree:e,readonly:r,onSubmit:async e=>{var r;await a({variables:{treeData:{id:e.id,label:e.label,libraries:(null==(r=e.libraries)?void 0:r.filter((e=>e.library)))??null}},refetchQueries:["GET_TREES"]}),l&&i.replace({pathname:"/trees/edit/"+e.id})},onCheckIdExists:async e=>(await t({variables:{filters:{id:[e]}}}),!!s&&!!s.trees&&!s.trees.list.length)})}var de=f,ce=v,me=de&&1/w(new de([,-0]))[1]==1/0?function(e){return new de(e)}:ce,be=_,ue=x,pe=Z,he=C,ye=me,ge=w;var fe=I,ve=function(e,r,i){var l=-1,a=ue,t=e.length,n=!0,s=[],o=s;if(i)n=!1,a=pe;else if(t>=200){var d=r?null:ye(e);if(d)return ge(d);n=!1,a=he,o=new be}else o=r?[]:s;e:for(;++l<t;){var c=e[l],m=r?r(c):c;if(c=i||0!==c?c:0,n&&m==m){for(var b=o.length;b--;)if(o[b]===m)continue e;r&&o.push(m),s.push(c)}else a(o,m,i)||(o!==s&&o.push(m),s.push(c))}return s};var we=function(e,r){return e&&e.length?ve(e,fe(r)):[]};const _e=r(ee)`
    position: absolute;
    top: 2rem;
    right: 2rem;
`;function xe({readonly:e,treeLibraries:r,tree:i,onSubmitSettings:s}){var o,c,m;const{lang:b}=d(),{t:u}=l(),p=(null==(m=null==(c=null==(o=i.permissions_conf)?void 0:o.filter((e=>e.libraryId===r.library.id)))?void 0:c[0])?void 0:m.permissionsConf)??null,h=(null==p?void 0:p.permissionTreeAttributes)?null==p?void 0:p.permissionTreeAttributes.map((l=>({key:"a.id",menuItem:k(l.label,b),render:()=>n(U.Pane,{className:"grow flex-col height100",children:n(re,{treeAttribute:l,permissionType:O.tree_node,applyTo:`${i.id}/${r.library.id}`,readOnly:e},l.id)},"treePermissions")}))):[];return h.unshift({key:"libPermissions",menuItem:u("permissions.library_tab_name"),render:()=>n(U.Pane,{className:"grow flex-col height100",children:n(E,{type:O.tree_library,applyTo:`${i.id}/${r.library.id}`,readOnly:e},"libPermissions")},"libPermissions")}),a(t,{children:[n(_e,{permissionsSettings:p,onChangeSettings:e=>s(r.library.id,e),library:r.library,readonly:e}),n(U,{panes:h,className:"grow flex-col height100"})]})}function Ce({tree:e,readonly:r,onSubmitSettings:i}){const{t:a}=l(),{lang:t}=d();let s=[{key:"treePermissions",menuItem:a("permissions.tree_tab_name"),render:()=>n(U.Pane,{className:"grow flex-col height100",children:n(E,{type:O.tree,applyTo:e.id,readOnly:r},"treePermissions")},"treePermissions")}];return s=[...s,...e.libraries.map((l=>({key:l.library.id,menuItem:k(l.library.label,t),render:()=>n(U.Pane,{className:"grow flex-col height100",children:n(xe,{tree:e,treeLibraries:l,onSubmitSettings:i,readonly:r})},l.library.id)})))],n(U,{panes:s,className:"grow flex-col height100"})}function Ie({tree:e,readonly:r}){const[i]=Q(ie);return n(Ce,{tree:e,readonly:r,onSubmitSettings:(r,l)=>{const a=[{libraryId:r,permissionsConf:l},...(e.permissions_conf??[]).map((e=>({libraryId:e.libraryId,permissionsConf:{permissionTreeAttributes:e.permissionsConf.permissionTreeAttributes.map((e=>e.id)),relation:e.permissionsConf.relation}})))],t=we(a,(e=>e.libraryId));return i({variables:{treeData:{id:e.id,permissions_conf:t}}})}})}const ke="library",Oe="__root__",Pe="__all__",Ae=r.div`
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    margin: 0.25rem 0 1rem 0;
    padding: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    cursor: grab;
    width: 100%;
    background-color: ${e=>e.isOver?"#f5f5f5":"#FFF"};
    position: relative;
`,Se=r.div`
    margin-top: 1rem;
`,De=r(s)`
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    &&&,
    &&&:hover,
    &&&:focus {
        padding: 0;
        margin: 0;
        border: none;
        box-shadow: none;
    }
`,Te=r(q)`
    cursor: pointer;
`;function je({libraryItem:e,parentItemId:r,tree:s,readOnly:o,onMove:c}){const{lang:m}=d(),[b,u]=P.useState(!1),{t:p}=l(),[,h]=L({item:{type:ke,from:r,library:e},canDrag:!o,end:(r,i)=>{const l=i.getDropResult();l&&c(e.library.id,r.from,l.id)}}),[{isOverNested:y,isOverElement:g},f]=B({accept:[ke],canDrop:()=>!o,drop:(r,i)=>{if(i.isOver({shallow:!0}))return u(!0),{id:e.library.id}},collect:e=>({isOverElement:e.isOver({shallow:!0}),isOverNested:e.isOver()})}),v=s.libraries.filter((r=>e.settings.allowedChildren.some((e=>e===r.library.id||"__all__"===e)))),w=b||y;return n(Ae,{ref:h,isOver:g,"data-testid":`dependencies-library-item-${e.library.id}`,children:a("div",{ref:f,children:[a(Te,{size:"small",onClick:()=>{u(!b)},children:[a("span",{children:[n(i,w?{name:"triangle down",style:{fontSize:"1rem"}}:{name:"triangle right",style:{fontSize:"1rem"}}),A(e.library.label,m)]}),!o&&n(De,{basic:!0,circular:!0,size:"small",onClick:i=>{i.preventDefault(),i.stopPropagation(),c(e.library.id,r,null)},"aria-label":p("admin.remove"),children:n(i,{name:"trash"})})]}),w&&n(t,{children:v.length?a(Se,{"data-testid":"allowed-children",children:[a("div",{children:[p("trees.allow_children"),":"]}),v.map((r=>n(je,{tree:s,libraryItem:r,parentItemId:e.library.id,readOnly:o,onMove:c},r.library.id)))]}):n("div",{children:p("trees.no_children_allowed")})})]})},e.library.id)}const Re=r.div`
    background: ${e=>e.isOver?"#f5f5f5":"#FFF"};
    border: 2px dashed #ccc;
    border-radius: 0.25rem;
    padding: 1rem;
    margin: 1rem 0;
`,Ne=r.div`
    color: #ccc;
    font-weight: bold;
    margin: 3rem auto;
    text-align: center;
`;function $e({tree:e,onMove:r,readOnly:i}){const{t:t}=l(),[{isOver:s},o]=B({accept:[ke],canDrop:()=>!i,drop:(e,r)=>{if(r.isOver({shallow:!0}))return{id:Oe}},collect:e=>({isOver:e.isOver({shallow:!0})})}),d=e.libraries.filter((e=>e.settings.allowedAtRoot));return a(Re,{ref:o,isOver:s,"data-testid":"dependencies-editor-root",children:[n(q,{size:"small",children:t("trees.root")}),d.length?d.map((l=>n(je,{tree:e,libraryItem:l,parentItemId:Oe,readOnly:i,onMove:r},l.library.id))):n(Ne,{children:t("trees.no_root_libraries")})]})}const Me=r.div`
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    margin: 1rem 0;
    padding: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    cursor: grab;
    width: 100%;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
`,ze=r(s)`
    &&&,
    &&&:hover,
    &&&:focus {
        border: none;
        box-shadow: none;
    }
`;function Ee({treeLibrary:e,readOnly:r,onMove:t}){const{lang:s}=d(),{t:o}=l(),[,c]=L({item:{type:"library",from:null,library:e},canDrag:!r,end:(r,i)=>{const l=i.getDropResult();l&&t(e.library.id,null,l.id)}});return a(Me,{ref:c,"data-testid":`library-item-${e.library.id}`,children:[A(e.library.label,s),!r&&n(ze,{icon:!0,circular:!0,basic:!0,size:"small",onClick:()=>{t(e.library.id,null,Oe)},"aria-label":o("admin.add"),children:n(i,{name:"plus"})})]},e.library.id)}const Le=r.div`
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 1fr;
    grid-template-areas: 'libraries deps';
    gap: 1rem;
    height: 100%;
`,Be=r.div`
    grid-area: libraries;
    overflow: auto;
    width: 250px;
`,Fe=r.div`
    border-left: 1px solid #ccc;
    padding-left: 1rem;
    grid-area: deps;
    overflow: auto;
    position: relative;
`;function Ge({tree:e,readOnly:r,onChange:i,loading:t}){const{t:s}=l(),o=e.libraries.reduce(((e,r)=>(e[r.library.id]=r.settings,e)),{}),d=(e,r,l)=>{l===Oe?o[e]={...o[e],allowedAtRoot:!0}:l&&(o[l]={...o[l],allowedChildren:[...o[l].allowedChildren,e].filter((e=>e!==Pe))}),r===Oe?o[e]={...o[e],allowedAtRoot:!1}:r&&(o[r]={...o[r],allowedChildren:o[r].allowedChildren.filter((r=>r!==e&&r!==Pe))}),i(o)};return a(Le,{children:[n(Be,{"data-testid":"libraries-list",children:a(q,{size:"small",children:[s("trees.libraries"),e.libraries.map((e=>n(Ee,{treeLibrary:e,readOnly:r,onMove:d},e.library.id)))]})}),a(Fe,{"data-testid":"dependencies-editor",children:[a(q,{size:"small",children:[s("trees.dependencies"),t&&n(S,{size:"tiny",active:!0,inline:!0,style:{marginLeft:"1rem"}})]}),n($e,{tree:e,readOnly:r,onMove:d})]})]})}function Ve({tree:e,readOnly:r}){l();const[i,{loading:a}]=Q(ie,{onError:e=>{}});return n(Ge,{tree:e,readOnly:r,onChange:async r=>{var l;await i({variables:{treeData:{id:e.id,libraries:null==(l=e.libraries)?void 0:l.map((e=>({library:e.library.id,settings:{allowMultiplePositions:r[e.library.id].allowMultiplePositions,allowedAtRoot:r[e.library.id].allowedAtRoot,allowedChildren:r[e.library.id].allowedChildren}})))}}})},loading:a})}function Qe({tree:e,readonly:r}){const{t:i}=l(),{lang:s}=d(),o=y(),c=D(),m=null===e,b=m?i("trees.new"):k((null==e?void 0:e.label)??null,s)||e.id,u=[{key:"infos",mustBeDisplayed:!0,menuItem:i("trees.informations"),render:()=>n(U.Pane,{className:"grow",children:n(oe,{tree:e,readonly:r})},"infos")},{key:"structure",mustBeDisplayed:!m,menuItem:i("trees.structure"),render:()=>n(U.Pane,{className:"grow",children:n(Ve,{tree:e,readOnly:r})},"structure")},{key:"explorer",mustBeDisplayed:!m,menuItem:i("trees.explorer"),render:()=>n(U.Pane,{className:"grow",children:n(F,{withFakeRoot:!0,fakeRootLabel:b,tree:e,readOnly:r})},"explorer")},{key:"permissions",mustBeDisplayed:!m,menuItem:i("trees.permissions"),render:()=>n(U.Pane,{className:"grow",children:n(Ie,{tree:e,readonly:r})},"structure")}].filter((e=>e.mustBeDisplayed)),p=c?c.hash.replace("#",""):void 0,[h,g]=P.useState(p?u.findIndex((e=>p===e.key)):0);return a(t,{children:[n(q,{className:"no-grow",children:b}),n(U,{activeIndex:h,onTabChange:(e,r)=>{r.panes&&void 0!==r.activeIndex&&(g(Number(r.activeIndex.toString())),null==o||o.push(`#${r.panes[r.activeIndex].key}`))},menu:{secondary:!0,pointing:!0},panes:u,className:"grow flex-col height100"})]})}const qe=({match:e})=>{var r,i;const l=e.params.id,t=T(),{loading:s,error:o,data:d}=j(G,{variables:{id:l},skip:!l});return s?n(R,{withDimmer:!0}):void 0!==o?a("p",{children:["Error: ",o.message]}):l&&!(null==(r=null==d?void 0:d.trees)?void 0:r.list.length)?n("div",{children:"Unknown tree"}):n(Qe,{tree:(null==(i=null==d?void 0:d.trees)?void 0:i.list[0])??null,readonly:!t.permissions[N.admin_edit_tree]})};export{qe as default};
