import React from 'react';
import {set, useFormValue} from 'sanity';
import {legacyBlocks} from '../reading-text.mjs';

export function RichInput(props) {
 const legacy = useFormValue(['body']);
 return React.createElement(React.Fragment,null,
  !props.value?.length && legacy && React.createElement('button',{
   type:'button',onClick:()=>props.onChange(set(legacyBlocks(legacy))),
  },'Copy existing article into the formatting editor'),
  props.renderDefault(props),
 );
}
