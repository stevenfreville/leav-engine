import{P as e,n as i,p as a,f as n,r as l,j as t,o as s,L as r,I as o,q as d,R as c,t as p,v as u,w as m,F as _,M as h,x as y,B as g,s as b,y as v,z as f,C as k,D as x,G as w,H as C,J as A,h as I,K as S,E as K,N as R,O as E,Q as H,S as N,l as P}from"./index-da778430.js";import{T as j,u as z,M as D,H as L}from"./Header-90427ac0.js";import{T as $}from"./Tab-13a14f2c.js";import{D as B,F as G,a as T,b as F}from"./DefinePermByUserGroupView-a11a63fc.js";import{I as V}from"./Input-94df8f06.js";import{P as q}from"./Popup-65e7a174.js";import{C as O,D as M}from"./DeleteButton-48c58b6e.js";import{R as U,F as Q}from"./FileSelector-dfcc0982.js";import{d as Y}from"./dayjs.min-1675693b.js";import"./Checkbox-69de3138.js";import"./Dropdown-4600c907.js";import"./getLibrariesQuery-8f805ce0.js";function J(){const n={libraries:[e.admin_access_libraries,e.admin_create_library,e.admin_delete_library,e.admin_edit_library],attributes:[e.admin_access_attributes,e.admin_create_attribute,e.admin_delete_attribute,e.admin_edit_attribute],trees:[e.admin_access_trees,e.admin_create_tree,e.admin_delete_tree,e.admin_edit_tree],applications:[e.admin_access_applications,e.admin_create_application,e.admin_delete_application,e.admin_edit_application],version_profiles:[e.admin_access_version_profiles,e.admin_create_version_profile,e.admin_delete_version_profile,e.admin_edit_version_profile],permissions:[e.admin_access_permissions,e.admin_edit_permission],preferences:[e.admin_manage_global_preferences],tasks:[e.admin_access_tasks,e.admin_cancel_task,e.admin_delete_task],api_keys:[e.admin_access_api_keys,e.admin_edit_api_key,e.admin_create_api_key,e.admin_delete_api_key]};return i(B,{type:a.admin,actions:n})}const W=n`
    ${l}
    query GET_API_KEYS($filters: ApiKeysFiltersInput, $sort: SortApiKeysInput) {
        apiKeys(filters: $filters, sort: $sort) {
            list {
                id
                label
                key
                expiresAt
                createdBy {
                    ...RecordIdentity
                }
                createdAt
                modifiedBy {
                    ...RecordIdentity
                }
                modifiedAt
                user {
                    ...RecordIdentity
                }
            }
        }
    }
`;function X({apiKeys:e,filters:a,loading:n,onFiltersUpdate:l,onRowClick:p,actions:u}){const{t:m}=t();return s(j,{selectable:!0,striped:!0,children:[s(j.Header,{children:[s(j.Row,{children:[i(j.HeaderCell,{width:4,children:m("admin.label")}),i(j.HeaderCell,{width:4,children:m("api_keys.expiresAt")}),i(j.HeaderCell,{width:4,children:m("api_keys.user")}),i(j.HeaderCell,{width:1})]}),s(j.Row,{className:"filters",children:[i(j.HeaderCell,{children:i(V,{size:"small",fluid:!0,placeholder:m("admin.label")+"...",name:"label","aria-label":"label",value:a.label||"",onChange:(e,i)=>{l({...a,[i.name]:i.value})}})}),i(j.HeaderCell,{}),i(j.HeaderCell,{}),i(j.HeaderCell,{})]})]}),i(j.Body,{children:n?i(j.Row,{children:i(j.Cell,{colSpan:4,children:i(r,{})})}):(e??[]).map((e=>{const a=null!==e.expiresAt&&e.expiresAt<Date.now()/1e3;return s(j.Row,{onClick:()=>{p(e)},children:[i(j.Cell,{children:e.label}),s(j.Cell,{children:[a&&i(q,{content:m("api_keys.expiration_warning"),trigger:i(o,{name:"warning sign",color:"yellow"}),position:"top center"}),e.expiresAt?new Date(1e3*e.expiresAt).toLocaleString():m("api_keys.never")]}),i(j.Cell,{children:i(d,{record:e.user.whoAmI})}),i(j.Cell,{textAlign:"right",width:1,className:"actions",children:u.map(((i,a)=>c.cloneElement(i,{key:a,apiKey:e})))})]},e.id)}))})]})}const Z=n`
    mutation DELETE_API_KEY($id: String!) {
        deleteApiKey(id: $id) {
            id
        }
    }
`,ee=({apiKey:a})=>{const{t:n}=t(),l=p(),[s]=z(Z,{update:(e,{data:{deleteApiKey:i}})=>{u(e,i)}});return l.permissions[e.admin_delete_api_key]?i(O,{action:async()=>s({variables:{id:a.id}}),confirmMessage:n("api_keys.confirm_delete",{keyLabel:a.label}),children:i(M,{disabled:!1})}):null},ie=n`
    ${l}
    mutation SAVE_API_KEY($apiKey: ApiKeyInput!) {
        saveApiKey(apiKey: $apiKey) {
            id
            label
            key
            expiresAt
            createdBy {
                ...RecordIdentity
            }
            createdAt
            modifiedBy {
                ...RecordIdentity
            }
            modifiedAt
            user {
                ...RecordIdentity
            }
        }
    }
`;function ae({onChange:e,label:a,value:n,...l}){const{t:r}=t(),d=m.useRef(),[p,u]=c.useState(!1),[b,v]=c.useState(!1),f=Y(),k=[{text:r("api_keys.one_week"),value:f.add(1,"week").unix()},{text:r("api_keys.one_month"),value:f.add(1,"month").unix()},{text:r("api_keys.six_months"),value:f.add(6,"months").unix()},{text:r("api_keys.one_year"),value:f.add(1,"year").unix()}],x=[{text:r("api_keys.never"),value:se},...k,{text:r("api_keys.custom")+"...",value:re}],w=n&&Number(n)<Date.now()/1e3;return s(_,{children:[i("label",{children:a}),i(h,{info:!0,visible:!0,children:s("p",{children:[i(o,{name:"info circle"}),n?r(w?"api_keys.expiration_reminder_expired":"api_keys.expiration_reminder",{date:new Date(1e3*Number(n)).toLocaleString(),interpolation:{escapeValue:!1}}):r("api_keys.expiration_reminder_never")]})}),p&&s(_,{children:[i(y,{innerRef:d,children:i(G.Dropdown,{...l,onChange:(i,a)=>{a.value===re?v(!0):(u(!1),v(!1),a.value===se&&(a.value=null),e(i,a))},options:x})}),b&&i(G.Input,{"data-testid":"custom-date-input",type:"date","aria-label":"expiresAt",title:"expiresAt",onChange:(i,a)=>{const n=Y(a.value).unix();e(i,{...a,value:n})},width:4,name:"expiresAt"})]}),!p&&i(g,{onClick:()=>{u(!0)},size:"small",basic:!0,children:r("api_keys.edit_expiration")})]})}const ne=b(G)`
    && {
        position: unset;
        height: 100%;
    }
`,le=b.div`
    overflow-y: auto;
    height: 100%;
`,te=b.div`
    border-top: 1px solid #dddddd;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1em;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 0.5rem;
`,se="__never__",re="__custom__";function oe({onSubmit:e,apiKey:a,errors:n,readonly:l,loading:r,onClose:d}){var c;const{t:p}=t(),u=!(null==a?void 0:a.id),m=v().shape({label:f().nullable().required(),expiresAt:k().nullable(),user:v().nullable().required()}),y={label:(null==a?void 0:a.label)??null,expiresAt:(null==a?void 0:a.expiresAt)??null,user:(null==(c=null==a?void 0:a.user)?void 0:c.whoAmI)??null},b=()=>d();return s(_,{children:[(null==n?void 0:n.extensions.code)===x.PERMISSION_ERROR&&i(h,{negative:!0,children:s(h.Header,{children:[i(o,{name:"ban"})," ",n.message,i(o,{"aria-label":"ban"})," ",n.message]})}),i(T,{initialValues:y,onSubmit:async i=>{const n={id:(null==a?void 0:a.id)??null,label:i.label,expiresAt:i.expiresAt,userId:i.user.id};await e(n)},validateOnChange:!0,validationSchema:m,children:({handleSubmit:e,handleBlur:a,setFieldValue:t,errors:d,values:c,touched:m,submitForm:_})=>{const h=n&&n.extensions.code===x.VALIDATION_ERROR?n.extensions.fields:{},y=async(e,i)=>{await t(i.name,i.value)},v=async(e,i)=>{await y(0,i),u||_()},f=e=>{u?a(e):_()},k=e=>w(e,m,h||{},d),C=e=>{"Enter"===e.key&&_()};return s(ne,{onSubmit:()=>e(),"aria-label":"infos-form",$isNewKey:u,children:[i(le,{children:s(G.Group,{grouped:!0,children:[i(F,{error:k("label"),children:i(G.Input,{label:p("admin.label"),width:"4",name:"label","aria-label":"label",disabled:l,onChange:y,onBlur:f,onKeyPress:C,value:c.label??""})}),i(G.Group,{grouped:!0,children:i(F,{error:k("expiresAt"),children:i(ae,{value:c.expiresAt,required:!0,label:p("api_keys.expiresAt"),width:"6",name:"expiresAt","aria-label":"expiresAt",disabled:l,onChange:v,onBlur:f,onKeyPress:C,placeholder:p("api_keys.select_expiration_date"),fluid:!0})})}),i(F,{error:k("user"),children:i(U,{onChange:async e=>{await v(0,{name:"user",value:e})},value:c.user??null,label:p("api_keys.user"),libraries:["users"],required:!0})})]})}),s(te,{children:[s(g,{className:"close-button",onClick:b,children:[i(o,{name:"cancel"})," ",p("admin.close")]}),u&&s(g,{labelPosition:"left",icon:!0,type:"submit",primary:!0,disabled:l,loading:r,children:[i(o,{name:"save"}),p("admin.submit")]})]})]})}})]})}const de=b.div`
    font-size: 1rem;
    font-weight: normal;
    color: #999;
    display: flex;
    gap: 0.5rem;
`,ce=b(D.Content)`
    height: 30rem;
    overflow: auto;
`;function pe({apiKey:e,onClose:a,readonly:n}){const l=()=>a(),{t:r}=t(),{addMessage:d}=C(),[p,{loading:u}]=z(ie),[m,_]=c.useState(e),y=!(null==m?void 0:m.id);return s(D,{size:"large",open:!0,onClose:l,centered:!0,closeIcon:!0,style:{maxHeight:"90vh"},children:[s(D.Header,{children:[y?r("api_keys.new"):m.label,!y&&s(de,{children:[s("span",{children:[r("api_keys.creation_details",{date:new Date(1e3*m.createdAt).toLocaleString(),user:m.user.whoAmI.label,interpolation:{escapeValue:!1}}),","]}),i("span",{children:r("api_keys.modification_details",{date:new Date(1e3*m.modifiedAt).toLocaleString(),user:m.user.whoAmI.label,interpolation:{escapeValue:!1}})})]})]}),s(ce,{children:[!y&&m.key&&s(h,{success:!0,icon:!0,children:[i(o,{name:"checkmark",size:"big"}),s(h.Content,{children:[s(h.Header,{children:[r("api_keys.key_display",{key:m.key}),i(g,{circular:!0,onClick:()=>{navigator.clipboard.writeText(m.key),d({type:A.SUCCESS,content:r("api_keys.copy_success")})},icon:"copy",title:r("api_keys.copy_key"),style:{marginLeft:"1rem"}})]}),i(o,{name:"warning sign"}),r("api_keys.key_display_warning")]})]}),i(oe,{apiKey:m,onSubmit:async e=>{const i=await p({variables:{apiKey:e},update:e=>{y&&e.evict({fieldName:"apiKeys"})}});_(i.data.saveApiKey)},onClose:l,readonly:n,errors:null,loading:u})]})]})}function ue(){const a=p(),{t:n}=t(),[l,r]=c.useState({}),[d,u]=c.useState({apiKey:null,isEditing:!1}),{loading:m,error:h,data:y}=I(W,{variables:{filters:{...S(l,["label"])}}});if(h)return i(K,{message:h.message});const b=(null==y?void 0:y.apiKeys.list)??[];return s(_,{children:[a.permissions[e.admin_create_api_key]&&s(g,{primary:!0,icon:!0,labelPosition:"left",size:"medium",onClick:()=>{u({apiKey:null,isEditing:!0})},children:[i(o,{name:"plus"}),n("api_keys.new")]}),i(X,{apiKeys:b,filters:l,sort:null,loading:m,onFiltersUpdate:e=>{r(e)},onRowClick:e=>{u({apiKey:e,isEditing:!0})},actions:[i(ee,{})]}),d.isEditing&&i(pe,{apiKey:d.apiKey,onClose:()=>{u({apiKey:null,isEditing:!1})}})]})}const me=R`
    ${l}
    mutation SAVE_GLOBAL_SETTINGS($settings: GlobalSettingsInput!) {
        saveGlobalSettings(settings: $settings) {
            name
            icon {
                id
                ...RecordIdentity
            }
        }
    }
`;function _e({settings:e,onSubmit:a}){var n;const{t:l}=t(),[r,o]=m.useState(e.name);return m.useEffect((()=>{o(e.name)}),[e.name]),s(G,{children:[i(G.Input,{type:"text",name:"name","aria-label":"name",value:r,label:l("general.customization.name"),onBlur:async e=>{const i=e.target,n=i.value;return a({[i.name]:n})},onKeyPress:e=>{if("Enter"===e.key){e.target.blur()}},onChange:e=>{const i=e.target.value;o(i)}}),i(G.Field,{children:i(Q,{onChange:e=>{a({icon:e?{library:e.library.id,recordId:e.id}:null})},value:null==(n=null==e?void 0:e.icon)?void 0:n.whoAmI,label:l("general.customization.icon")})})]})}function he(){const{loading:e,error:a,data:n}=I(E),[l,{loading:t,error:o}]=z(me,{update:(e,{data:{saveGlobalSettings:i}})=>{e.writeQuery({query:E,data:{globalSettings:i}})}});if(e)return i(r,{});if(a)return i(K,{message:a.message});const d=null==n?void 0:n.globalSettings;return s(_,{children:[o&&i(K,{message:null==o?void 0:o.message}),i(_e,{settings:d,onSubmit:async e=>(await l({variables:{settings:e}})).data.saveGlobalSettings})]})}const ye=R`
    query GET_ALL_PLUGINS {
        plugins {
            name
            description
            version
            author
        }
    }
`,ge=({plugins:e,loading:a})=>{const{t:n}=t();return i(_,{children:s(j,{striped:!0,basic:"very",size:"small",compact:!0,children:[i(j.Header,{children:s(j.Row,{children:[i(j.HeaderCell,{width:4,children:n("plugins.label")}),i(j.HeaderCell,{width:6,children:n("plugins.description")}),i(j.HeaderCell,{width:2,children:n("plugins.version")}),i(j.HeaderCell,{width:5,children:n("plugins.author")})]})}),s(j.Body,{children:[a&&i(j.Row,{children:i(j.Cell,{colSpan:6,children:i(r,{})})}),e.length?e.map((e=>s(j.Row,{children:[i(j.Cell,{children:e.name}),i(j.Cell,{children:e.description}),i(j.Cell,{children:e.version}),i(j.Cell,{children:e.author})]},e.name))):i(j.Row,{textAlign:"center",disabled:!0,children:i(j.Cell,{colSpan:6,children:n("plugins.no_plugins")})})]})]})})};ge.defaultProps={loading:!1,plugins:[]};const be=()=>{t();const{loading:e,error:a,data:n}=I(ye);return s(_,{children:[a&&i(K,{message:a.message}),!a&&i(ge,{loading:e||!n,plugins:(null==n?void 0:n.plugins)??[]})]})},ve=R`
    query GET_VERSION {
        version
    }
`;function fe(){const{loading:e,error:a,data:n}=I(ve),{t:l}=t();let o=null==n?void 0:n.version;return o&&!isNaN(parseInt(o[0],10))&&(o="v"+o),s(H,{divided:!0,relaxed:!0,children:[s(H.Item,{children:[i(H.Icon,{name:"cogs"}),s(H.Content,{children:[e&&i(r,{}),a&&i(K,{message:a.message}),n&&i("span",{children:l("general.version",{version:o})})]})]}),s(H.Item,{children:[i(H.Icon,{name:"puzzle piece"}),s(H.Content,{children:[i(H.Header,{children:l("plugins.title")}),i(be,{})]})]})]})}function ke(){var a;const{t:n}=t(),l=p(),r=N(),d=P(),c=[{key:"infos",menuItem:n("general.infos"),render:()=>i($.Pane,{className:"grow",children:i(fe,{})},"infos")}];l.permissions[e.admin_access_permissions]&&c.push({key:"admin_permissions",menuItem:n("general.admin_permissions"),render:()=>i($.Pane,{className:"grow flex-col height100",children:i(J,{})},"permissions")}),l.permissions[e.admin_edit_global_settings]&&c.push({key:"customization",menuItem:n("general.customization.title"),render:()=>i($.Pane,{className:"grow flex-col height100",children:i(he,{})},"customization")}),l.permissions[e.admin_access_api_keys]&&c.push({key:"api_keys",menuItem:n("general.api_keys"),render:()=>i($.Pane,{className:"grow flex-col",children:i(ue,{})},"api_keys")});const u=null==(a=null==r?void 0:r.hash)?void 0:a.replace("#",""),[h,y]=m.useState(Math.max(c.findIndex((e=>u===e.key)),0));return s(_,{children:[s(L,{className:"no-grow",children:[i(o,{name:"cogs"}),n("general.title")]}),i($,{activeIndex:h,onTabChange:(e,i)=>{i.panes&&void 0!==i.activeIndex&&(y(Number(i.activeIndex.toString())),null==d||d.push(`#${i.panes[i.activeIndex].key}`))},menu:{secondary:!0,pointing:!0},panes:c,className:"grow flex-col height100"})]})}export{ke as default};
