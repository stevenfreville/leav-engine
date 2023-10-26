import{f as e,s as i,dr as r,ds as l,dt as a,bs as t,j as s,w as n,R as o,o as d,n as u,cG as c,cR as b,I as p,bv as m,D as v,z as f,y as h,db as g,F as y,M as _,cy as P,G as w,l as k,t as $,h as j,L as I,E as x,P as C}from"./index-da778430.js";import{o as A}from"./omit-793fed5e.js";import{g as E}from"./getVersionProfilesQuery-6debab2c.js";import{x as R,a as S,F as V,b as q,e as L}from"./DefinePermByUserGroupView-a11a63fc.js";import{T as D,u as B,H as O}from"./Header-90427ac0.js";import{c as N,A as Q,E as T,T as F}from"./EditAttributeModal-88522277.js";import{C as G}from"./DeleteButton-48c58b6e.js";import{I as M}from"./Input-94df8f06.js";import"./_baseClone-266ca0ea.js";import"./Checkbox-69de3138.js";import"./Dropdown-4600c907.js";import"./Tab-13a14f2c.js";import"./getAttributesQuery-614214c0.js";import"./DefineTreePermissionsView-c97777f8.js";import"./getLibrariesQuery-8f805ce0.js";import"./Popup-65e7a174.js";import"./getTreesQuery-8499c1fa.js";import"./dayjs.min-1675693b.js";const z=e`
    query GET_VERSION_PROFILE_BY_ID($id: ID!) {
        versionProfiles(filters: {id: $id}) {
            list {
                id
                label
                description
                trees {
                    id
                    label
                }
                linkedAttributes {
                    id
                    label
                }
            }
        }
    }
`,U=e`
    mutation SAVE_VERSION_PROFILE($versionProfile: VersionProfileInput!) {
        saveVersionProfile(versionProfile: $versionProfile) {
            id
            label
            description
            trees {
                id
                label
            }
        }
    }
`,H=i.div`
    &&& {
        margin-top: 1rem;
    }
`,K=i.div`
    max-height: 20rem;
    overflow-y: auto;
    border-top-left-radius: ${r};
    border-top-right-radius: ${r};

    && > table {
        border-radius: 0;
        border-bottom: none;
        border-top: none;
    }
`,Y=i(D.Row)`
    cursor: pointer;
`,J=i.span`
    color: rgba(0, 0, 0, 0.4);
    font-size: 0.9rem;
    margin-left: 0.5rem;
`,W=i.div`
    padding: 0.5rem 1rem;
    border: 1px solid ${l};
    border-radius: ${r};
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    background: ${a};
`,X=i.div`
    padding: 0.5rem 1rem;
    border: 1px solid ${l};
    border-radius: ${r};
    background: ${a};

    ${e=>e.$hasAttributes&&"\n        border-top-left-radius: 0;\n        border-top-right-radius: 0;\n    "}
`;function Z({readonly:e,profile:i}){const{lang:r}=t(),{t:l}=s(),[a,v]=n.useState({visible:!1}),[f]=B(N),h=R(),[g,y]=o.useState(!1),[_,P]=o.useState(""),w=()=>{y(!1)},k=e=>()=>{v({visible:!0,attribute:e.id})},$=i.linkedAttributes.filter((e=>!_||e.id.match(new RegExp(`${_}`,"i"))||Object.values(e.label).some((e=>e.match(new RegExp(`${_}`,"i"))))));return d(H,{className:"field",children:[u("label",{children:l("version_profiles.linked_attributes")}),!!i.linkedAttributes.length&&u(W,{children:u(M,{icon:"search",size:"small",onChange:e=>{P(e.target.value)},placeholder:l("admin.search_placeholder")})}),u(K,{children:u(D,{children:u(D.Body,{children:$.map((e=>{const a=c(e.label,r);return d(Y,{onClick:k(e),children:[d(D.Cell,{children:[a,u(J,{children:e.id})]}),u(D.Cell,{width:1,children:u(G,{action:(t=e.id,async()=>{await f({variables:{attrData:{id:t,versions_conf:{versionable:!0,profile:null}}}}),h.writeQuery({query:z,variables:{id:i.id},data:{versionProfiles:{__typename:"VersionProfileList",list:[{...i,linkedAttributes:[...i.linkedAttributes.filter((e=>e.id!==t))]}]}}})}),confirmMessage:l("version_profiles.unlink_attribute_confirm",{attributeLabel:a}),children:u(b,{icon:"cancel",name:"unlink","aria-label":"unlink"})})})]},e.id);var t}))})})}),!e&&u(X,{$hasAttributes:!!i.linkedAttributes.length,children:d(b,{basic:!0,labelPosition:"left",onClick:e=>{e.preventDefault(),e.stopPropagation(),y(!0)},children:[u(p,{name:"plus"}),l("version_profiles.link_attributes")]})}),g&&u(Q,{openModal:g,onClose:w,onSubmit:async e=>{try{const r=await Promise.all(e.map((e=>f({variables:{attrData:{id:e,versions_conf:{versionable:!0,profile:i.id}}}}))));w(),h.writeQuery({query:z,variables:{id:i.id},data:{versionProfiles:{__typename:"VersionProfileList",list:[{...i,linkedAttributes:[...i.linkedAttributes,...r.map((e=>e.data.saveAttribute))]}]}}})}catch(r){}},filter:{type:[m.advanced,m.advanced_link,m.tree]},selection:i.linkedAttributes.map((e=>e.id))}),a.visible&&u(T,{open:!0,onClose:()=>v({visible:!1}),attribute:a.attribute})]})}const ee=i((({isNewProfile:e,...i})=>u(V,{...i})))`
    && {
        position: unset;
        display: grid;
        grid-template-rows: ${e=>e.isNewProfile?"auto 6rem":"auto"};
    }
`,ie=i.div``,re=i.div`
    border-top: 1px solid #dddddd;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1em;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    align-items: center;
`;function le({readonly:e,loading:i,profile:r,onSubmit:l,errors:a,onCheckIdUniqueness:n}){const{t:o}=s(),{availableLangs:c,defaultLang:b}=t(),m=e||i,k={id:"",label:c.reduce(((e,i)=>(e[i]="",e)),{}),description:c.reduce(((e,i)=>(e[i]="",e)),{}),trees:[]},$=!r,j={...k,...r,trees:((null==r?void 0:r.trees)??[]).map((e=>e.id))},I=a&&a.extensions.code===v.VALIDATION_ERROR?a.extensions.fields:{};let x=f().required().matches(/^[a-z0-9_]+$/);$&&(x=x.test("isIdUnique",o("admin.validation_errors.id_exists"),n));const C=h().shape({id:x,label:h().shape({[b]:f().required()}),description:h().shape({[b]:f()}).nullable(),trees:g(f())});return d(y,{children:[(null==a?void 0:a.extensions.code)===v.PERMISSION_ERROR&&u(_,{negative:!0,children:d(_.Header,{children:[u(p,{name:"ban"})," ",a.message,u(p,{"aria-label":"ban"})," ",a.message]})}),u(S,{initialValues:j,onSubmit:e=>{l(e)},validateOnChange:!0,validationSchema:C,children:({handleSubmit:l,handleBlur:a,setFieldValue:t,errors:s,values:n,touched:v,submitForm:f})=>{const h=(e,i)=>{g(e,i);const{name:r,value:l}=i,[a,s]=r.split(".");$&&"label"===a&&s===b&&t("id",P(l))},g=async(e,i)=>{const r="checkbox"===i.type?i.checked:i.value,l=i.name;await t(l,r)},y=e=>w(e,v,I||{},s),_=e=>{$?a(e):f()},k=e=>{"Enter"===e.key&&f()};return d(ee,{onSubmit:()=>l(),"aria-label":"infos-form",isNewProfile:$,children:[d(ie,{children:[d(V.Group,{grouped:!0,children:[u("label",{children:o("admin.label")}),c.map((e=>{var i;return u(q,{error:y(`label.${e}`),children:u(V.Input,{required:e===b,label:e,width:"4",name:`label.${e}`,"aria-label":`label.${e}`,disabled:m,onChange:h,onBlur:_,onKeyPress:k,value:(null==(i=n.label)?void 0:i[e])??""})},e)}))]}),d(V.Group,{grouped:!0,children:[u("label",{children:o("admin.description")}),c.map((e=>{var i;return u(q,{error:y(`description.${e}`),children:u(V.Input,{label:e,value:(null==(i=n.description)?void 0:i[e])??"",width:"4",name:`description.${e}`,"aria-label":`description.${e}`,disabled:m,onChange:g,onBlur:_,onKeyPress:k})},e)}))]}),u(q,{error:y("id"),children:u(V.Input,{required:!0,label:o("admin.id"),width:"4",disabled:!$||m,name:"id","aria-label":"id",onChange:g,onBlur:_,value:n.id})}),u(q,{error:y("trees"),children:u(F,{label:o("version_profiles.trees"),placeholder:o("version_profiles.select_trees"),fluid:!0,selection:!0,multiple:!0,width:"4",disabled:m,name:"trees","aria-label":"id",onChange:async(e,i)=>{await g(e,i),$||f()},onBlur:_,value:n.trees})}),!$&&u(Z,{profile:r,readonly:e})]}),!e&&$&&u(re,{children:d(V.Button,{type:"submit",primary:!0,icon:!0,loading:i,"data-test-id":"attribute-infos-submit-btn",style:{float:"right"},labelPosition:"left",children:[u(p,{name:"save outline"}),o("admin.submit")]})})]})}})]})}function ae({match:e}){var i,r,l,a,n,o,b;const p=R(),m=k(),{t:v}=s(),{lang:f}=t(),h=$(),g=(null==(i=e.params)?void 0:i.id)??null,_=!g,{loading:P,error:w,data:S}=j(z,{variables:{id:g},skip:_}),[V,{loading:q,error:D}]=B(U,{onCompleted:e=>{_&&m.push(`/version_profiles/edit/${e.saveVersionProfile.id}`)},update:e=>{_&&e.evict({fieldName:"versionProfiles"})}});if(P)return u(I,{});if(w)return u(x,{message:w.message});if(!_&&!(null==(r=null==S?void 0:S.versionProfiles)?void 0:r.list.length))return u(x,{message:v("version_profiles.not_found")});const N=(null==(l=null==S?void 0:S.versionProfiles)?void 0:l.list.length)?A(null==(n=null==(a=null==S?void 0:S.versionProfiles)?void 0:a.list)?void 0:n[0],"__typename"):null,Q=!(null==(o=null==h?void 0:h.permissions)?void 0:o[C.admin_edit_version_profile]),T=(null==(b=null==w?void 0:w.graphQLErrors)?void 0:b.length)?w.graphQLErrors[0]:null,F=(null==N?void 0:N.label)?c(N.label,f):v("version_profiles.new");return d(y,{children:[d(O,{children:[u(O.Content,{children:F}),u(L,{})]}),u(le,{profile:N,readonly:Q,loading:q,errors:T,onCheckIdUniqueness:async e=>{var i,r;if(!e)return!0;try{const l=await p.query({query:E,variables:{filters:{id:e}},errorPolicy:"all"});return!(null==(r=null==(i=null==l?void 0:l.data)?void 0:i.versionProfiles)?void 0:r.list.length)}catch(l){return!0}},onSubmit:async e=>{try{await V({variables:{versionProfile:{id:e.id,description:e.description,label:e.label,trees:e.trees}}})}catch(i){console.error(i)}}})]})}i.div`
    display: grid;
    grid-template-rows: auto 1fr;
`;export{ae as default};
