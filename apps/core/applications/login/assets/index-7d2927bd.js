import{j as e,s as r,B as t,R as i,g as o,u as n,a,C as s,M as l,F as d,b as c,S as m,r as u,i as g,c as p,d as h,e as f,f as y,P as b,h as w,k as $,I as v,o as _,A as E,l as I,m as T,n as x,p as S,U as P,L as k,q as A,t as C,v as L,w as R,x as D,y as B,z as O,D as N,E as j}from"./vendor-a814004c.js";!function(){const e=document.createElement("link").relList;if(!(e&&e.supports&&e.supports("modulepreload"))){for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver((e=>{for(const t of e)if("childList"===t.type)for(const e of t.addedNodes)"LINK"===e.tagName&&"modulepreload"===e.rel&&r(e)})).observe(document,{childList:!0,subtree:!0})}function r(e){if(e.ep)return;e.ep=!0;const r=function(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),"use-credentials"===e.crossOrigin?r.credentials="include":"anonymous"===e.crossOrigin?r.credentials="omit":r.credentials="same-origin",r}(e);fetch(e.href,r)}}();const z=e.jsx,q=e.jsxs,F="#000000",M={primaryColor:"#0f97e4",primaryColorLighter:"#37b2f0",defaultBg:"#ffffff",invertedDefaultBg:"#000000",defaultTextColor:F,invertedDefaultTextColor:"#ffffff",secondaryTextColor:F+"80",activeColor:"#def4ff",errorColor:"#e02020",secondaryBg:"#f0f0f0",lightBg:"#fafafa",headerBg:"#f4f4f4",borderColor:"#d9d9d9",borderLightColor:"rgb(240, 240, 240)",headerHeight:"3rem",navigationColumnWidth:"20rem",inheritedValuesVersionColor:"#FFBA00",checkerBoard:"repeating-conic-gradient(rgb(220,220,220) 0% 25%, rgb(240,240,240) 0% 50%) 50% / 20px 20px",imageDefaultBackground:"rgb(245, 245, 245)"},G={token:{colorPrimary:M.primaryColor,colorError:M.errorColor,colorBgBase:M.defaultBg,colorTextBase:M.defaultTextColor,colorBorder:M.borderColor,colorBorderSecondary:M.borderLightColor,colorSplit:M.borderColor,wireframe:!1},components:{Layout:{headerBg:M.secondaryBg,controlHeight:24},Dropdown:{controlItemBgHover:M.activeColor,colorSplit:M.borderLightColor},Menu:{colorActiveBarBorderSize:0},Table:{colorBgContainer:"transparent",colorFillAlter:M.lightBg}}},H={general:{colors:{primary:{primary100:"#ddf1fd",primary200:"#98d6f8",primary300:"#54baf4",primary400:M.primaryColor,primary500:"#0d80c2",primary600:"#0b6aa0",primary700:"#08537d"}}},components:{Button:{primary:{colors:{background:{hover:M.primaryColorLighter},border:{default:G.token.colorPrimary,hover:M.primaryColorLighter}}},default:{colors:{border:{hover:G.token.colorPrimary}}}},Input:{colors:{border:{hover:G.token.colorPrimary}}}}};r(t)`
    && {
        color: ${M.secondaryTextColor};
        box-shadow: none;
        &,
        &:hover,
        &[disabled] {
            background: transparent;
        }
        text-align: ${e=>e.$centered?"center":"left"};

        ${e=>e.$bordered?"":"&, &:hover {border: 0;}"}
    }
`,i.createContext(null);var U=(e=>(e.boolean="boolean",e.color="color",e.date="date",e.date_range="date_range",e.encrypted="encrypted",e.extended="extended",e.numeric="numeric",e.rich_text="rich_text",e.text="text",e))(U||{}),V=(e=>(e.advanced="advanced",e.advanced_link="advanced_link",e.simple="simple",e.simple_link="simple_link",e.tree="tree",e))(V||{});const Y=o`
    fragment RecordIdentity on Record {
        id
        whoAmI {
            id
            label
            subLabel
            color
            library {
                id
                label
            }
            preview
        }
    }
`,K=o`
    fragment DetailsApplication on Application {
        id
        label
        type
        description
        endpoint
        url
        color
        icon {
            ...RecordIdentity
        }
        module
        permissions {
            access_application
            admin_application
        }
        settings
    }
    ${Y}
`,X=o`
    fragment AttributeDetails on Attribute {
        id
        type
        format
        system
        readonly
        label
        description
        multiple_values
        metadata_fields {
            id
            label
            type
            format
        }
        versions_conf {
            versionable
            mode
            profile {
                id
                label
                trees {
                    id
                    label
                }
            }
        }
        libraries {
            id
            label
        }
        ... on StandardAttribute {
            unique
        }
        ... on LinkAttribute {
            linked_library {
                id
                label
            }
            reverse_link
        }
        ... on TreeAttribute {
            linked_tree {
                id
                label
            }
        }
    }
`,W=o`
    fragment LibraryDetails on Library {
        id
        label
        behavior
        system
        label
        fullTextAttributes {
            id
            label
        }
        attributes {
            ...LibraryAttributes
        }
        permissions_conf {
            permissionTreeAttributes {
                id
                ... on TreeAttribute {
                    linked_tree {
                        id
                    }
                }
                label
            }
            relation
        }
        recordIdentityConf {
            label
            subLabel
            color
            preview
            treeColorPreview
        }
        permissions {
            admin_library
            access_library
            access_record
            create_record
            edit_record
            delete_record
        }
        icon {
            ...RecordIdentity
        }
        previewsSettings {
            ...LibraryPreviewsSettings
        }
    }
    ${o`
    fragment LibraryAttributes on Attribute {
        id
        label
        system
        type
        format
        ...LibraryLinkAttributeDetails
    }
    ${o`
    fragment LibraryLinkAttributeDetails on LinkAttribute {
        linked_library {
            id
            behavior
        }
    }
`}
`}
    ${Y}
    ${o`
    fragment LibraryPreviewsSettings on LibraryPreviewsSettings {
        label
        description
        system
        versions {
            background
            density
            sizes {
                name
                size
            }
        }
    }
`}
`,J=o`
    fragment TreeDetails on Tree {
        id
        label
        behavior
        system
        libraries {
            library {
                id
                label
            }
            settings {
                allowMultiplePositions
                allowedAtRoot
                allowedChildren
            }
        }
    }
`;function Z({message:e,actionButton:r,showActionButton:i=!0,type:o="error"}){const{t:m,i18n:u}=n(),g=a(),p=z(t,{type:"primary",onClick:()=>g.replace("/"),children:m("global.go_back_home")}),h={error:{title:u.isInitialized?m("error.error_occurred"):"An error occurred",icon:z(s,{color:"red"}),message:"",actionButton:null},permission_error:{title:m("error.access_denied"),icon:z(l,{color:"red"}),message:m("error.access_denied_details"),actionButton:i?p:null},page_not_found_error:{title:m("error.page_not_found"),icon:z(d,{}),message:"",actionButton:i?p:null}};return z(c,{title:h[o].title,subTitle:e??h[o].message,status:"error",icon:h[o].icon,extra:r??h[o].actionButton})}o`
    query CHECK_APPLICATION_EXISTENCE($id: ID, $endpoint: String) {
        applications(filters: {id: $id, endpoint: $endpoint}) {
            totalCount
        }
    }
`,o`
    query GET_APPLICATION_BY_ID($id: ID!) {
        applications(filters: {id: $id}) {
            list {
                ...DetailsApplication
            }
        }
    }
    ${K}
`,o`
    query GET_APPLICATION_MODULES {
        applicationsModules {
            id
            description
            version
        }
    }
`,o`
    mutation SAVE_APPLICATION($application: ApplicationInput!) {
        saveApplication(application: $application) {
            ...DetailsApplication
        }
    }
    ${K}
`,o`
    query CHECK_ATTRIBUTE_EXISTENCE($id: ID!) {
        attributes(filters: {id: $id}) {
            totalCount
        }
    }
`,o`
    mutation DELETE_ATTRIBUTE($id: ID) {
        deleteAttribute(id: $id) {
            id
        }
    }
`,o`
    query GET_ATTRIBUTE_BY_ID($id: ID) {
        attributes(filters: {id: $id}) {
            list {
                ...AttributeDetails
            }
        }
    }
    ${X}
`,o`
    query GET_ATTRIBUTES {
        attributes {
            list {
                id
                label
                type
                format
                system
            }
        }
    }
`,o`
    query GET_VERSION_PROFILES($filters: VersionProfilesFiltersInput, $sort: SortVersionProfilesInput) {
        versionProfiles(filters: $filters, sort: $sort) {
            list {
                id
                label
            }
        }
    }
`,o`
    mutation SAVE_ATTRIBUTE($attribute: AttributeInput!) {
        saveAttribute(attribute: $attribute) {
            ...AttributeDetails
        }
    }
    ${X}
`,o`
    query CHECK_LIBRARY_EXISTENCE($id: [ID!]) {
        libraries(filters: {id: $id}) {
            totalCount
        }
    }
`,o`
    mutation DELETE_LIBRARY($id: ID) {
        deleteLibrary(id: $id) {
            id
        }
    }
`,o`
    query GET_LIBRARIES {
        libraries {
            list {
                ...LibraryLight
            }
        }
    }
    ${o`
    fragment LibraryLight on Library {
        id
        label
        icon {
            id
            whoAmI {
                id
                library {
                    id
                }
                preview
            }
        }
    }
`}
`,o`
    query GET_LIBRARY_BY_ID($id: [ID!]) {
        libraries(filters: {id: $id}) {
            list {
                ...LibraryDetails
            }
        }
    }
    ${W}
`,o`
    mutation saveLibrary($library: LibraryInput!) {
        saveLibrary(library: $library) {
            ...LibraryDetails
        }
    }
    ${W}
`,o`
    query IS_ALLOWED(
        $type: PermissionTypes!
        $actions: [PermissionsActions!]!
        $applyTo: ID
        $target: PermissionTarget
    ) {
        isAllowed(type: $type, actions: $actions, applyTo: $applyTo, target: $target) {
            name
            allowed
        }
    }
`,o`
    mutation INDEX_RECORDS($libraryId: String!, $records: [String!]) {
        indexRecords(libraryId: $libraryId, records: $records)
    }
`,o`
    mutation CANCEL_TASK($taskId: ID!) {
        cancelTask(taskId: $taskId)
    }
`,o`
    query CHECK_TREE_EXISTENCE($id: [ID!]) {
        trees(filters: {id: $id}) {
            totalCount
        }
    }
`,o`
    mutation DELETE_TREE($id: ID!) {
        deleteTree(id: $id) {
            id
        }
    }
`,o`
    query GET_TREE_BY_ID($id: [ID!]) {
        trees(filters: {id: $id}) {
            list {
                ...TreeDetails
            }
        }
    }
    ${J}
`,o`
    query GET_TREES {
        trees {
            list {
                ...TreeLight
            }
        }
    }
    ${o`
    fragment TreeLight on Tree {
        id
        label
    }
`}
`,o`
    mutation SAVE_TREE($tree: TreeInput!) {
        saveTree(tree: $tree) {
            ...TreeDetails
        }
    }
    ${J}
`,o`
    query USER_INFO($type: PermissionTypes!, $actions: [PermissionsActions!]!) {
        me {
            login
            ...RecordIdentity
        }
        permissions: isAllowed(type: $type, actions: $actions) {
            name
            allowed
        }
    }
    ${Y}
`;const Q=r(m)`
    && {
        display: block;
        margin: ${e=>e.compact?"1em":"3em"};
        font-size: inherit;
    }
`;function ee(e){return z(Q,{...e})}function re(){const[e,r]=u.useState(!0),[t,i]=u.useState(),[o,n]=u.useState("");return u.useEffect((()=>{(async()=>{try{const e=await fetch("/global-lang",{method:"GET"});if(!e.ok)throw new Error(404===e.status?"Unable to connect to server. Please check your Internet connection.":e.statusText,{cause:e});const r=await e.text();n(r)}catch(e){i(e.message)}finally{r(!1)}})()}),[]),{lang:o,error:t,loading:e}}var te,ie,oe,ne,ae,se,le,de,ce,me,ue,ge;(ie=te||(te={})).VALIDATION_ERROR="VALIDATION_ERROR",ie.PERMISSION_ERROR="PERMISSION_ERROR",ie.INTERNAL_ERROR="INTERNAL_ERROR",(ne=oe||(oe={})).IMAGE="image",ne.VIDEO="video",ne.AUDIO="audio",ne.DOCUMENT="document",ne.OTHER="other",(se=ae||(ae={})).DIVIDER="divider",se.FIELDS_CONTAINER="fields_container",se.TAB_FIELDS_CONTAINER="tab_fields_container",se.TEXT_BLOCK="text_block",se.TABS="tabs",(de=le||(le={})).TEXT_INPUT="input_field",de.DATE="date",de.CHECKBOX="checkbox",de.ENCRYPTED="encrypted",de.DROPDOWN="dropdown",de.LINK="link",de.TREE="tree",(me=ce||(ce={})).HORIZONTAL="horizontal",me.VERTICAL="vertical",(ge=ue||(ue={}))[ge.LOW=1]="LOW",ge[ge.MEDIUM=2]="MEDIUM",ge[ge.HIGH=3]="HIGH";const pe=(e="",r="hsl",t=30,i=80)=>{let o=0;for(let a=0;a<(null!=e?e:"").length;a++)o=e.charCodeAt(a)+((o<<5)-o);const n=o%360;switch(r){case"hex":return fe(n,t,i);case"rgb":const[e,r,o]=ye(n,t,i);return`rgb(${e},${r},${o})`;default:return`hsl(${n}, ${t}%, ${i}%)`}},he=(e,r,t)=>(t<0&&(t+=1),t>1&&(t-=1),t<1/6?e+6*(r-e)*t:t<.5?r:t<2/3?e+(r-e)*(2/3-t)*6:e),fe=(e,r,t)=>{const[i,o,n]=ye(e,r,t),a=e=>{const r=e.toString(16);return 1===r.length?"0"+r:r};return`#${a(i)}${a(o)}${a(n)}`},ye=(e,r,t)=>{let i,o,n;if(e/=360,t/=100,0===(r/=100))i=o=n=t;else{const a=t<.5?t*(1+r):t+r-t*r,s=2*t-a;i=he(s,a,e+1/3),o=he(s,a,e),n=he(s,a,e-1/3)}return[Math.round(255*i),Math.round(255*o),Math.round(255*n)]},be=e=>{const r=e.replace(/#/g,"");return(299*parseInt(r.substr(0,2),16)+587*parseInt(r.substr(2,2),16)+114*parseInt(r.substr(4,2),16))/1e3>=128?"#000000":"#FFFFFF"},we=(e,r=2)=>{if("string"!=typeof e||g(e.trim())||r<1)return"?";const t=e.split(" "),i=new RegExp(/[A-Za-z]+/g),o=new RegExp(/[1-9]+/g),n=e.match(i)?e.match(i):e.match(o);return $e(null!==n?n:t,r)},$e=(e,r)=>{let t="";if(1===e.length)t=e[0].slice(0,r);else{e.length<r&&(r=e.length);for(let i=0;i<r;i++)t+=e[i].charAt(0)}return t.toUpperCase()};r(p)`
    animation: appear 500ms, ${350}ms disappear ${2650}ms;
    color: ${e=>{var r,t;return(null==(t=null==(r=e.theme)?void 0:r.antd)?void 0:t.colorSuccess)??"inherit"}};

    @keyframes disappear {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(5);
        }
    }

    @keyframes appear {
        from {
            opacity: 0;
            transform: scale(5);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`,r(h)`
    color: ${e=>{var r,t;return(null==(t=null==(r=e.theme)?void 0:r.antd)?void 0:t.colorError)??"inherit"}};
`,r.div`
    font-weight: bold;
`,r.div`
    color: ${M.secondaryTextColor};
`,r(f.Item)`
    .ant-form-item-extra {
        min-height: 0;
    }
`,r.div`
    ${e=>e.$style}
`,r.fieldset`
    border-radius: ${e=>e.$themeToken.borderRadius}px;
    border: 1px solid ${e=>e.$themeToken.colorBorderSecondary};
    padding: ${e=>e.$themeToken.padding}px ${e=>e.$themeToken.padding/2}px;
    margin-bottom: ${e=>e.$themeToken.padding}px;

    legend {
        border: none;
        padding: 0 0.5rem;
        margin: 0 0 0 5%;
        font-size: 1em;
        color: ${e=>e.$themeToken.colorTextSecondary};
        width: auto;
    }

    ${e=>e.style}
`;var ve=(e=>(e.tiny="tiny",e.small="small",e.medium="medium",e.big="big",e))(ve||{});V.simple,V.simple_link,V.advanced,V.advanced_link,V.tree,U.boolean,U.date,U.date_range,U.encrypted,U.extended,U.numeric,U.text,U.color,U.rich_text;const _e=(e,r=!1)=>{if(r)return"1.2rem";switch(e){case ve.medium:return"3.5rem";case ve.big:return"6rem";case ve.small:return"2.5rem";case ve.tiny:return"1.7rem";default:return"2rem"}},Ee=r.div`
    border-radius: 50%;
    border: 1px solid ${M.borderColor};
    width: calc(${_e(null,!0)} + 0.5rem);
    height: calc(${_e(null,!0)} + 0.5rem);
    display: flex;
    align-items: center;
    justify-content: center;
`;function Ie({label:e}){const r=we(e,1);return z(Ee,{"data-testid":"simplistic-preview",children:r})}const Te=r.div`
    ${e=>e.style||""}
    background-color: ${e=>e.$bgColor};
    color: ${e=>e.$fontColor};
    font-size: ${({$size:e})=>`calc(${_e(e)} / 2.6)`};
    height: ${({$size:e})=>_e(e)};
    width: ${({$size:e})=>_e(e)};
    padding: 5px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 50%;
`;Te.displayName="GeneratedPreview";const xe=r.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${({size:e})=>_e(e)};
    width: ${({size:e})=>_e(e)};
    overflow: hidden;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
`;xe.displayName="ImagePreview";const Se=r.img`
    display: ${e=>e.$loaded?"block":"none"};
`;function Pe({label:e,color:r,image:t,size:i,style:o,simplistic:n=!1}){const[a,s]=u.useState(!1);if(n)return z(Ie,{label:e});if(t)return q(xe,{size:i,style:o,children:[!a&&z(y.Image,{style:{width:"65%",height:"65%",background:"none",margin:"auto"}}),z(Se,{role:"img",$loaded:a,src:t,alt:"record preview",onLoad:()=>s(!0),style:{maxHeight:"auto",maxWidth:"auto",width:"100%",height:"100%",objectFit:"cover",...o}})]});const l=r||pe(e),d=be(l);return z(Te,{"data-testid":"generated-preview",className:"initial",$bgColor:l,$fontColor:d,$size:i,style:{...o},children:we(e)})}const ke=r(y.Image)`
    &&& {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;

        .ant-skeleton-image-svg {
            width: 30%;
            height: 30%;
        }
    }
`;function Ae({style:e}){return z(ke,{style:{...e},className:"ant-skeleton-active"})}const Ce=r.div`
    &&& {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }
`;function Le({style:e}){return z(Ce,{children:z(b,{style:{display:"flex",justifyContent:"center",fontSize:e.height?`calc(${e.height} * 0.6)`:"120px",color:M.secondaryTextColor,...e}})})}const Re=r.div`
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border-radius: 0.25rem 0.25rem 0 0;
    width: fit-content;
    height: fit-content;
    margin: auto;
    background: ${M.imageDefaultBackground};

    && img {
        max-width: 100%;
        max-height: 100%;
        border-radius: 0;
    }
`;Re.displayName="ImagePreviewTile";const De=r.img`
    display: ${e=>e.$loaded?"block":"none"};
    border: 1px solid ${M.borderColor};
`,Be=r.div`
    ${e=>e.style||""}
    background-color: ${e=>e.$bgColor};
    color: ${e=>e.$fontColor};
    font-size: 4em;
    padding: 5px;
    height: 10rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 0.25rem 0.25rem 0 0;
`;function Oe({label:e,color:r,image:t,style:i,imageStyle:o,placeholderStyle:n}){const[a,s]=u.useState(!1),[l,d]=u.useState(!1);if(t)return q(Re,{style:{position:"relative",...i},children:[!a&&z(Ae,{}),l?z(Le,{style:{...i}}):z(De,{$loaded:a,src:t,alt:"record preview",style:{...o},onLoad:()=>s(!0),onError:()=>{s(!0),d(!0)}})]});const c=r||pe(e),m=be(c);return z(Be,{"data-testid":"generated-preview",className:"initial",$bgColor:c,$fontColor:m,style:n,children:we(e)})}Be.displayName="GeneratedPreviewTile",i.memo((function(e){return e.tile?z(Oe,{...e}):z(Pe,{...e})}));const Ne={[ve.tiny]:"0.3rem",[ve.small]:"0.5rem",[ve.medium]:"0.8rem",[ve.big]:"0.8rem"};r.div`
    border-left: ${e=>e.$withColor?`5px solid ${e.$color?e.$color:"transparent"}`:"none"};
    display: grid;
    grid-template-areas: ${e=>{return r=e.$withPreview,t=e.$withSubLabel,e.$tile?r?t?"\n                    'preview'\n                    'label'\n                    'sub-label'\n                ":"\n                'preview'\n                'label'\n            ":t?"\n                'label'\n                'sub-label'\n            ":"'label'":r?t?"\n                    'preview label'\n                    'preview sub-label'\n                ":"\n                'preview label'\n            ":t?"\n                'label'\n                'sub-label'\n            ":"'label'";var r,t}};

    grid-template-columns: ${e=>{if(!e.$withPreview||e.$tile)return"100%";const r=`calc(${_e(e.$size,(null==e?void 0:e.$simplistic)??!1)} + calc(2*${Ne[e.$size]}))`;return`${r} calc(100% - ${r})`}};
`,r.div`
    grid-area: preview;
    margin: ${e=>e.$tile?"0.3rem 0":`0 ${Ne[e.$size]}`};
    justify-self: center;
`,r.div`
    grid-area: label;
    font-weight: bold;
    overflow: hidden;
    align-self: ${e=>e.$simplistic||!e.$withSubLabel?"center":"end"};
    line-height: 1.3em;
`,r.div`
    grid-area: sub-label;
    font-weight: normal;
    color: rgba(0, 0, 0, 0.4);
    font-size: 0.9em;
    line-height: 1.3em;
`,o`
    fragment LibraryLight on Library {
        id
        label
        icon {
            id
            whoAmI {
                id
                library {
                    id
                }
                preview
            }
        }
    }

    query GET_LIBRARIES {
        libraries {
            list {
                ...LibraryLight
            }
        }
    }
`,o`
    query GET_ATTRIBUTES {
        attributes {
            list {
                id
                label
                type
                format
                system
            }
        }
    }
`,r.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;

    > input {
        flex-grow: 1;
    }
`,r.div`
    position: absolute;
    z-index: 1000;
    right: 0;
    top: 50%;
    transform: translateY(-50%); // center vertically

    display: flex;
    justify-content: space-around;
    padding: 0.5rem;

    & > * {
        margin: 0 0.2rem;
        box-shadow: 0px 2px 6px #0000002f;
    }

    ${e=>e.overrideStyle}
`,r.div`
    .floating-menu {
        display: none;
    }

    &:hover .floating-menu {
        display: block;
    }
`,r.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;

    > input {
        flex-grow: 1;
    }
`,r.div`
    && .ant-table-header {
        border-radius: 0;
    }
`,r(f.Item)`
    .ant-form-item-extra {
        min-height: 0;
    }
`,r(f.Item)`
    margin: 0;
`,r.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;

    > input {
        flex-grow: 1;
    }
`,r.div`
    .floating-menu {
        display: none;
    }

    &:hover .floating-menu {
        display: block;
    }
`,r.div`
    height: calc(95vh - 15rem);
    overflow-y: auto;
`,r.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;

    > input {
        flex-grow: 1;
    }
`,o`
    fragment TreeLight on Tree {
        id
        label
    }
    query GET_TREES {
        trees {
            list {
                ...TreeLight
            }
        }
    }
`,r(w)`
    cursor: pointer;
    align-self: flex-start;
`,r.div`
    display: flex;
    padding: 0.5rem;
    width: 100%;
    gap: 1rem;

    ${e=>e.style}
`,r.div`
    height: calc(95vh - 15rem);
`,r.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;

    > input {
        flex-grow: 1;
    }
`,r(f.Item)`
    .ant-form-item-extra {
        min-height: 0;
        position: absolute;
        left: 50px;
        top: 50%;
        transform: translateY(-50%);
    }
`,r.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`,r(f.Item)`
    position: relative;
    .ant-form-item-extra {
        min-height: 0;
    }
`,r.div`
    height: calc(95vh - 15rem);
`,o`
    fragment RecordIdentity on Record {
        id
        whoAmI {
            id
            label
            subLabel
            color
            library {
                id
                label
            }
            preview
        }
    }
`;const je=r.div`
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 10%;
`,ze=r($)`
    width: 30rem;
    max-width: 450px;
    box-sizing: border-box;
`,qe=({onSubmit:e,loading:r,forgotPasswordError:t,forgotPasswordSuccess:i})=>{const{t:o}=n(),[s,l]=u.useState(""),d=a();return z(je,{children:q(ze,{title:z("img",{src:"/global-icon/small",height:"100px"}),headStyle:{textAlign:"center",padding:"1rem"},style:{width:"30rem"},children:[z(v.Title,{level:"h3",children:o("forgotPassword.header")}),q(f,{onFinish:async()=>{e(s)},children:[z(f.Item,{hasFeedback:!0,name:"email",rules:[{type:"email",message:o("forgotPassword.email_not_valid")},{required:!0,message:o("forgotPassword.email_required")}],children:z(_,{"aria-label":o("forgotPassword.email"),placeholder:o("forgotPassword.email"),autoFocus:!0,value:s,onChange:(c=l,e=>{c(e.target.value)})})}),r&&z(f.Item,{children:z(E,{message:o("forgotPassword.loading.header"),description:o("forgotPassword.loading.text"),icon:z(m,{}),type:"warning",showIcon:!0})}),t&&z(f.Item,{children:z(E,{message:t,type:"error",showIcon:!0,icon:z(w,{style:{fontSize:"1.5em"}})})}),i&&z(f.Item,{children:z(E,{message:i,type:"success",showIcon:!0,icon:z(p,{style:{fontSize:"1.5em"}})})}),!r&&q(I,{wrap:!0,style:{float:"right"},direction:"horizontal",children:[z(f.Item,{children:z(T,{onClick:()=>{d.push("/")},type:"default",block:!0,children:o("forgotPassword.cancel")})}),z(f.Item,{children:z(T,{type:"primary",htmlType:"submit",icon:z(x,{}),block:!0,children:o("forgotPassword.submit")})})]})]})]})});var c},Fe="app",Me=window.location.pathname.split("/").filter((e=>e))[1],Ge=()=>{const{t:e}=n(),[r,t]=u.useState(!1),[i,o]=u.useState(""),[a,s]=u.useState("");return z(qe,{onSubmit:async r=>{try{t(!0),o(""),s("");const i=await fetch("/auth/forgot-password",{method:"POST",headers:new Headers([["Content-Type","application/json"]]),body:JSON.stringify({email:r,lang:S.language})});if(400===i.status)throw new Error(e("error.missing_parameters"));if(401===i.status)throw new Error(e("forgotPassword.error.user_not_found"));if(200===i.status&&s(e("forgotPassword.success")),!i.ok)throw new Error(e("error.no_server_response"))}catch(i){let r=i.message;i.message.indexOf("NetworkError")>-1&&(r=e("error.no_server_response")),o(r)}finally{t(!1)}},loading:r,forgotPasswordError:i,forgotPasswordSuccess:a})},He=e=>r=>{e(r.target.value)},Ue=r.div`
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 10%;
`,Ve=r($)`
    width: 30rem;
    max-width: 450px;
    box-sizing: border-box;
`,Ye=({onSubmit:e,loading:r,loginError:t})=>{const{t:i}=n(),o=a(),[s,l]=u.useState(""),[d,c]=u.useState("");return z(Ue,{children:z(Ve,{title:z("img",{src:"/global-icon/small",height:"100px"}),headStyle:{textAlign:"center",padding:"1rem"},children:q(f,{onFinish:async()=>{e(s,d)},children:[z(f.Item,{children:z(_,{prefix:z(P,{}),name:"login","aria-label":i("login.login"),placeholder:i("login.login"),autoFocus:!0,value:s,onChange:He(l)})}),z(f.Item,{children:z(_.Password,{prefix:z(k,{}),name:"password","aria-label":i("login.password"),placeholder:i("login.password"),value:d,onChange:He(c)})}),r&&z(f.Item,{children:z(E,{message:i("login.loading.header"),description:i("login.loading.text"),icon:z(m,{}),type:"warning",showIcon:!0})}),t&&z(f.Item,{children:z(E,{message:t,type:"error",showIcon:!0,icon:z(w,{style:{fontSize:"1.5em"}})})}),!r&&z(f.Item,{style:{textAlign:"center"},children:z(T,{type:"primary",loading:r,disabled:r,htmlType:"submit",children:i("login.submit")})}),z(f.Item,{style:{textAlign:"right"},children:z(T,{onClick:()=>{o.push("/forgot-password")},type:"link",children:i("login.forgot_password")})})]})})})},Ke=()=>{const e=A(),{t:r}=n(),[t,i]=u.useState(!1),[o,a]=u.useState(""),{setRefreshToken:s}=function(){const e="refreshToken";return{setRefreshToken:r=>{localStorage.setItem(e,r)},refreshToken:async()=>{const r=localStorage.getItem(e),t=await fetch("/auth/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refreshToken:r})});if(!t.ok)throw new Error(t.statusText,{cause:t});t.json().then((r=>{localStorage.setItem(e,r.refreshToken)}))}}}(),l=e.dest??"/";return z(Ye,{onSubmit:async(e,t)=>{try{i(!0),a("");const o=await fetch("/auth/authenticate",{method:"POST",headers:new Headers([["Content-Type","application/json"]]),body:JSON.stringify({login:e,password:t})});if(401===o.status)throw new Error(r("login.error.bad_credentials"));if(!o.ok)throw new Error(r("error.no_server_response"));const n=await o.json();s(n.refreshToken),window.location.replace(l)}catch(o){let e=o.message;o.message.indexOf("NetworkError")>-1&&(e=r("error.no_server_response")),a(e)}finally{i(!1)}},loading:t,loginError:o})},Xe=e=>r=>{e(r.target.value)},We=r.div`
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 10%;
`,Je=r($)`
    width: 30rem;
    max-width: 450px;
    box-sizing: border-box;
`,Ze=({onSubmit:e,loading:r,resetPasswordError:t})=>{const{t:i}=n(),[o,a]=u.useState(""),[s,l]=u.useState("");return z(We,{children:q(Je,{title:z("img",{src:"/global-icon/small",height:"100px"}),headStyle:{textAlign:"center",padding:"1rem"},style:{width:"30rem"},children:[q(v.Title,{level:"h3",children:[" ",i("resetPassword.header")]}),q(f,{onFinish:async()=>{e(o)},children:[z(f.Item,{hasFeedback:!0,name:"newPassword",rules:[{required:!0,message:i("resetPassword.new_password_required")}],children:z(_.Password,{"aria-label":i("resetPassword.new_password"),placeholder:i("resetPassword.new_password"),autoFocus:!0,value:o,onChange:Xe(a)})}),z(f.Item,{name:"confirmPassword",dependencies:["newPassword"],hasFeedback:!0,rules:[{required:!0,message:i("resetPassword.confirm_password_required")},({getFieldValue:e})=>({validator:(r,t)=>t&&e("newPassword")!==t?Promise.reject(new Error(i("resetPassword.wrong_confirm_password"))):Promise.resolve()})],children:z(_.Password,{"aria-label":i("resetPassword.confirm_password"),placeholder:i("resetPassword.confirm_password"),value:s,onChange:Xe(l)})}),r&&z(f.Item,{children:z(E,{message:i("resetPassword.loading.header"),description:i("resetPassword.loading.text"),icon:z(m,{}),type:"warning",showIcon:!0})}),t&&z(f.Item,{children:z(E,{message:t,type:"error",showIcon:!0,icon:z(w,{style:{fontSize:"1.5em"}})})}),!r&&z(f.Item,{style:{textAlign:"center"},children:z(T,{type:"primary",loading:r,disabled:r,htmlType:"submit",block:!0,children:i("resetPassword.submit")})})]})]})})},Qe=()=>{const{t:e}=n(),[r,t]=u.useState(!1),[i,o]=u.useState(""),{token:a}=A();return z(Ze,{onSubmit:async r=>{try{t(!0),o("");const i=await fetch("/auth/reset-password",{method:"POST",headers:new Headers([["Content-Type","application/json"]]),body:JSON.stringify({token:a,newPassword:r})});if(400===i.status)throw new Error(e("error.missing_parameters"));if(401===i.status)throw new Error(e("resetPassword.error.invalid_token"));if(422===i.status)throw new Error(e("resetPassword.error.invalid_password"));if(!i.ok)throw new Error(e("error.no_server_response"));window.location.replace("/")}catch(i){let r=i.message;i.message.indexOf("NetworkError")>-1&&(r=e("error.no_server_response")),o(r)}finally{t(!1)}},loading:r,resetPasswordError:i})};function er(){const[e,r]=u.useState(!0),[t,i]=u.useState(),[o,n]=u.useState("");return u.useEffect((()=>{(async()=>{try{const e=await fetch("/global-name",{method:"GET"}),r=await e.text();n(r)}catch(e){i(String(e))}finally{r(!1)}})()}),[]),{name:o,error:t,loading:e}}const rr=r.div`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #8051fc;
`;function tr(){const{name:e,loading:r,error:t}=er();return u.useEffect((()=>{document.title=`${e}`}),[e]),t?z(Z,{message:t}):r?z(ee,{}):z(rr,{children:z(C,{basename:`${Fe}/${Me}`,children:q(L,{children:[z(R,{exact:!0,path:"/",children:z(Ke,{})}),z(R,{path:"/reset-password/:token",children:z(Qe,{})}),z(R,{path:"/forgot-password",children:z(Ge,{})})]})})})}const ir={},or=function(e,r,t){if(!r||0===r.length)return e();const i=document.getElementsByTagName("link");return Promise.all(r.map((e=>{if((e=function(e){return window.__dynamic_base__+"/"+e}(e))in ir)return;ir[e]=!0;const r=e.endsWith(".css"),o=r?'[rel="stylesheet"]':"";if(!!t)for(let t=i.length-1;t>=0;t--){const o=i[t];if(o.href===e&&(!r||"stylesheet"===o.rel))return}else if(document.querySelector(`link[href="${e}"]${o}`))return;const n=document.createElement("link");return n.rel=r?"stylesheet":"modulepreload",r||(n.as="script",n.crossOrigin=""),n.href=e,document.head.appendChild(n),r?new Promise(((r,t)=>{n.addEventListener("load",r),n.addEventListener("error",(()=>t(new Error(`Unable to preload CSS for ${e}`))))})):void 0}))).then((()=>e()))},nr=e=>{S.use(D).use(B((async(e,r)=>{try{return await((e,r)=>{const t=e[r];return t?"function"==typeof t?t():Promise.resolve(t):new Promise(((e,t)=>{("function"==typeof queueMicrotask?queueMicrotask:setTimeout)(t.bind(null,new Error("Unknown variable dynamic import: "+r)))}))})(Object.assign({"./locales/en/translations.json":()=>or((()=>import("./translations-0df16f2e.js")),[]),"./locales/fr/translations.json":()=>or((()=>import("./translations-0b312fb0.js")),[])}),`./locales/${e}/${r}.json`)}catch(t){console.error("Error while fetching translations files",t)}}))).use(O).init({fallbackLng:e,ns:["translations"],defaultNS:"translations",react:{useSuspense:!0}})};function ar(){const{lang:e,loading:r,error:t}=re(),[o,n]=u.useState(!1);return u.useEffect((()=>{!o&&e&&(nr(e),n(!0))}),[e]),t?z(Z,{message:t}):r?z(ee,{}):o&&z(i.StrictMode,{children:z(N,{customTheme:H,children:z(tr,{})})})}var sr;j.createRoot(document.getElementById("root")).render(z(ar,{})),sr&&sr instanceof Function&&or((()=>import("./web-vitals-6de2ccaf.js")),[]).then((({getCLS:e,getFID:r,getFCP:t,getLCP:i,getTTFB:o})=>{e(sr),r(sr),t(sr),i(sr),o(sr)}));
