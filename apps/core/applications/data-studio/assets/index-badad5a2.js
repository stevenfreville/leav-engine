import{u as s,r as e,j as t}from"./useTranslation-6a88ac92.js";import{ao as o,bw as r}from"./recordIdentityFragment-3ccdcea1.js";import{l as n}from"./utils-c614281c.js";import{u as a,a as i,I as l,s as p,L as m,T as d}from"./index-135e49ab.js";import{s as u}from"./styled-components.browser.esm-2d72260f.js";import"./ImportReducerContext-19d27c8c.js";import"./index-8160faf7.js";const c=u.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    padding-bottom: 1rem;

    > * {
        flex-grow: 1;
    }
`;function f(){var u,f,g,x;const{t:j}=s(),{lang:b}=o(),v=a(),w=i();return e.useEffect((()=>{const s={content:j("info.base-message",{appLabel:`${w.globalSettings.name} - ${n(w.currentApp.label,b)}`,interpolation:{escapeValue:!1}}),type:l.basic};v(p(s))}),[j,v]),"none"===(null==(f=null==(u=null==w?void 0:w.currentApp)?void 0:u.settings)?void 0:f.libraries)&&"none"===(null==(x=null==(g=null==w?void 0:w.currentApp)?void 0:g.settings)?void 0:x.trees)?t.jsx(r,{style:{margin:"1rem"},message:j("home.no_libraries_or_trees"),type:"info",showIcon:!0}):t.jsxs(c,{children:[t.jsx(m,{}),t.jsx(d,{})]})}export{f as default};
