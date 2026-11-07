import React,{useState} from 'react';
import {previewMarkup} from './preview.js';
export function PreviewAction(props){
 const [open,setOpen]=useState(false);const doc=props.draft||props.published;
 return {label:'Preview article',disabled:!doc,onHandle:()=>setOpen(true),dialog:open?{type:'dialog',header:'Private article preview',onClose:()=>{setOpen(false);props.onComplete()},content:React.createElement('iframe',{title:'Private article text preview',srcDoc:previewMarkup(doc),sandbox:'',style:{width:'100%',height:'70vh',border:0}})}:undefined};
}
export function nameAction(original,label){
 const Action=props=>{const result=original(props);return result?{...result,label:result.disabled?result.label:label}:null};
 Action.action=original.action;
 return Action;
}
