// @ts-nocheck
/* eslint-disable */

import React, { useCallback, useMemo } from 'react';
import isHotkey from 'is-hotkey';
import {
  Descendant,
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
  BaseElement,
  Text,
} from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, withReact } from 'slate-react';
import cn from 'classnames';
import withTable from './Plugins/withTable';
import Image from './Elements/Embed/Image';
import Video from './Elements/Embed/Video';

// Define custom types
interface CustomElement extends BaseElement {
  type?: string;
  align?: string;
  attr?: Record<string, any>;
  children: Descendant[];
}

interface CustomText extends Text {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  underline?: boolean;
}

declare module 'slate' {
  interface CustomTypes {
    Editor: Editor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

interface RenderElementProps {
  attributes: Record<string, any>;
  children: React.ReactNode;
  element: CustomElement;
}

interface RenderLeafProps {
  attributes: Record<string, any>;
  children: React.ReactNode;
  leaf: CustomText;
}

export const RichTextRender: React.FC<{
  initialVal?: string;
  className?: string;
}> = ({ initialVal, className }) => {
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  const editor = useMemo(
    () => withTable(withHistory(withReact(createEditor()))),
    []
  );

  const initVal = initialVal ? JSON.parse(initialVal) : initialValue;

  return (
    <Slate editor={editor} initialValue={initVal}>
      <Editable
        readOnly
        className={cn('', className)}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        autoFocus
        onKeyDown={(event) => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event as any)) {
              event.preventDefault();
              const mark = HOTKEYS[hotkey];
              toggleMark(editor, mark);
            }
          }
        }}
      />
    </Slate>
  );
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes((n as CustomElement).type || '') &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });

  let newProperties: Partial<CustomElement>;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
  }
  Transforms.setNodes<CustomElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: Editor, format: string, blockType = 'type') => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n as CustomElement)[blockType] === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const Element: React.FC<RenderElementProps> = (props) => {
  const { attributes, children, element } = props;
  const style = { textAlign: element.align };

  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote
          className="border-l-4 border-gray-500 italic my-4 pl-4"
          style={style}
          {...attributes}
        >
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul className="list-disc ml-10" style={style} {...attributes}>
          {children}
        </ul>
      );
    case 'heading-one':
      return (
        <h1 className="text-4xl" style={style} {...attributes}>
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 className="text-3xl " style={style} {...attributes}>
          {children}
        </h2>
      );
    case 'heading-three':
      return (
        <h2 className="text-xl " style={style} {...attributes}>
          {children}
        </h2>
      );
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case 'numbered-list':
      return (
        <ol className="list-decimal ml-10" style={style} {...attributes}>
          {children}
        </ol>
      );
    case 'table':
      return (
        <table className="border-spacing-1 border-gray-700 border-[1px]">
          <tbody {...attributes}>{children}</tbody>
        </table>
      );
    case 'table-row':
      return (
        <tr
          className="min-w-[30px] min-h-2 border-spacing-1  border-gray-700 border-[1px] p-3"
          {...attributes}
        >
          {children}
        </tr>
      );
    case 'table-cell':
      return (
        <td
          className="min-w-[30px] min-h-2 border-spacing-1  border-gray-700 border-[1px] p-3"
          {...element.attr}
          {...attributes}
        >
          {children}
        </td>
      );
    case 'image':
      return <Image {...props} />;
    case 'video':
      return <Video {...props} />;
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [
      { text: 'This is editable ' },
      { text: 'rich', bold: true },
      { text: ' text, ' },
      { text: 'much', italic: true },
      { text: ' better than a ' },
      { text: '<textarea>', code: true },
      { text: '!' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: "Since it's rich text, you can do things like turn a selection of text ",
      },
      { text: 'bold', bold: true },
      {
        text: ', or add a semantically rendered block quote in the middle of the page, like this:',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Try it out for yourself!' }],
  },
];
