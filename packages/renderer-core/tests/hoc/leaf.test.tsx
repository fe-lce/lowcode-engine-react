import { render, screen, RenderResult, act } from '@testing-library/react';
import React from 'react';
import { createElement } from 'react';
import '../utils/react-env-init';
import { leafWrapper } from '../../src/hoc/leaf';
import components from '../utils/components';
import Node from '../utils/node';
import { parseData } from '../../src/utils';
import { sleep } from '../utils/sleep';

let rerenderCount = 0;

const nodeMap = new Map();

const makeSnapshot = (component: RenderResult) => {
  let { asFragment } = component;
  expect(asFragment()).toMatchSnapshot();
};

const baseRenderer: any = {
  __debug() {},
  __getComponentProps(schema: any) {
    return schema.props;
  },
  __getSchemaChildrenVirtualDom(schema: any) {
    return schema.children;
  },
  context: {
    engine: {
      createElement,
    },
  },
  props: {
    __host: {},
    getNode: (id) => nodeMap.get(id),
    __container: {
      rerender: () => {
        rerenderCount = 1 + rerenderCount;
      },
      autoRepaintNode: true,
    },
    documentId: '01',
  },
  __parseData(data, scope) {
    return parseData(data, scope, {});
  },
};

let Div, DivNode, Text, TextNode, component: RenderResult, textSchema, divSchema;
let id = 0;

beforeEach(() => {
  textSchema = {
    id: 'text' + id,
    props: {
      content: 'content',
    },
  };

  divSchema = {
    id: 'div' + id,
  };

  id++;
  Div = leafWrapper(components.Div as any, {
    schema: divSchema,
    baseRenderer,
    componentInfo: {},
    scope: {},
  });

  DivNode = new Node(divSchema);
  TextNode = new Node(textSchema);

  nodeMap.set(divSchema.id, DivNode);
  nodeMap.set(textSchema.id, TextNode);

  Text = leafWrapper(components.Text as any, {
    schema: textSchema,
    baseRenderer,
    componentInfo: {},
    scope: {},
  });

  component = render(
    <Div _leaf={DivNode}>
      <Text _leaf={TextNode} content="content"></Text>
    </Div>,
  );
});

afterEach(() => {
  component.unmount();
});

describe('onPropChange', () => {
  it('change textNode [key:content] props', async () => {
    await act(() => {
      TextNode.emitPropChange({
        key: 'content',
        newValue: 'new content',
      } as any);
    });

    const newTextDom = await screen.findByText('new content');

    expect(newTextDom).toBeTruthy();
  });

  it('change textNode [key:___condition___] props, hide textNode component', async () => {
    // mock leaf?.export result
    TextNode.schema.condition = false;
    TextNode.emitPropChange({
      key: '___condition___',
      newValue: false,
    } as any);
    await sleep();

    makeSnapshot(component);
  });

  it('change textNode [key:___condition___] props, but not hidden component', async () => {
    TextNode.schema.condition = true;
    await act(() => {
      TextNode.emitPropChange({
        key: '___condition___',
        newValue: false,
      } as any);
    });
    await sleep();

    makeSnapshot(component);
  });

  it('change textNode [key:content], content in this.props but not in leaf.export result', async () => {
    makeSnapshot(component);

    delete TextNode.schema.props.content;
    await act(() => {
      TextNode.emitPropChange(
        {
          key: 'content',
          newValue: null,
        } as any,
        true,
      );
    });
    await sleep();

    makeSnapshot(component);

    const { findByTestId } = component;
    const newTextNode = await findByTestId('text');
    const content = newTextNode.getAttribute('content');

    expect(content).toBeNull();
  });

  it('change textNode [key:___loop___], make rerender', async () => {
    expect(
      leafWrapper(components.Text as any, {
        schema: textSchema,
        baseRenderer,
        componentInfo: {},
        scope: {},
      }),
    ).toEqual(Text);

    const nextRerenderCount = rerenderCount + 1;

    await act(() => {
      TextNode.emitPropChange({
        key: '___loop___',
        newValue: 'new content',
      } as any);
    });
    await sleep(0);

    expect(rerenderCount).toBe(nextRerenderCount);
    expect(
      leafWrapper(components.Text as any, {
        schema: textSchema,
        baseRenderer,
        componentInfo: {},
        scope: {},
      }),
    ).not.toEqual(Text);
  });
});

describe('lifecycle', () => {
  it('props change and make componentWillReceiveProps', () => {
    makeSnapshot(component);

    // 没有 __tag 标识
    component.rerender(
      <Div _leaf={DivNode}>
        <Text _leaf={TextNode} content="content 123"></Text>
      </Div>,
    );

    makeSnapshot(component);

    // 有 __tag 标识
    component.rerender(
      <Div _leaf={DivNode}>
        <Text _leaf={TextNode} __tag="111" content="content 123"></Text>
      </Div>,
    );

    makeSnapshot(component);
  });

  it('leaf change and make componentWillReceiveProps', async () => {
    const newTextNodeLeaf = new Node(textSchema);
    nodeMap.set(textSchema.id, newTextNodeLeaf);

    component.rerender(
      <Div _leaf={DivNode}>
        <Text componentId={textSchema.id} __tag="222" content="content 123"></Text>
      </Div>,
    );
    await act(() => {
      newTextNodeLeaf.emitPropChange({
        key: 'content',
        newValue: 'content new leaf',
      } as any);
    });
    await sleep();

    makeSnapshot(component);
  });
});

describe('mini unit render', () => {
  let miniRenderSchema, MiniRenderDiv, MiniRenderDivNode;
  beforeEach(() => {
    miniRenderSchema = {
      id: 'miniDiv' + id,
    };

    MiniRenderDiv = leafWrapper(components.MiniRenderDiv as any, {
      schema: miniRenderSchema,
      baseRenderer,
      componentInfo: {},
      scope: {},
    });

    MiniRenderDivNode = new Node(miniRenderSchema, {
      componentMeta: {
        isMinimalRenderUnit: true,
      },
    });

    TextNode = new Node(textSchema, {
      parent: MiniRenderDivNode,
    });

    nodeMap.set(miniRenderSchema.id, MiniRenderDivNode);
    nodeMap.set(textSchema.id, TextNode);

    component = render(
      <MiniRenderDiv _leaf={MiniRenderDivNode}>
        <Text _leaf={TextNode} content="content"></Text>
      </MiniRenderDiv>,
    );
  });

  it('make text props change', async () => {
    if (!MiniRenderDivNode.schema.props) {
      MiniRenderDivNode.schema.props = {};
    }
    MiniRenderDivNode.schema.props['newPropKey'] = 'newPropValue';

    makeSnapshot(component);

    const newTextNode = await screen.findByTestId('div');

    TextNode.emitPropChange({
      key: 'content',
      newValue: 'new content',
    } as any);
    await sleep(0);

    // FIXME @testing-library/react 获取不到 stateNode
    // expect((newTextNode as any)?.stateNode.renderUnitInfo).toEqual({
    //   singleRender: false,
    //   minimalUnitId: 'miniDiv' + id,
    //   minimalUnitName: undefined,
    // });

    makeSnapshot(component);
  });

  it('dont render mini render component', async () => {
    const TextNode = new Node(textSchema, {
      parent: new Node(
        {
          id: 'random',
        },
        {
          componentMeta: {
            isMinimalRenderUnit: true,
          },
        },
      ),
    });

    nodeMap.set(textSchema.id, TextNode);

    render(
      <div>
        <Text _leaf={TextNode} content="content"></Text>
      </div>,
    );

    const nextCount = rerenderCount + 1;

    TextNode.emitPropChange({
      key: 'content',
      newValue: 'new content',
    } as any);

    await sleep(0);

    expect(rerenderCount).toBe(nextCount);
  });

  it('leaf is a mock function', () => {
    const TextNode = new Node(textSchema, {
      parent: {
        isEmpty: () => false,
      },
    });

    render(
      <div>
        <Text _leaf={TextNode} content="content"></Text>
      </div>,
    );

    TextNode.emitPropChange({
      key: 'content',
      newValue: 'new content',
    } as any);
  });

  // FIXME @testing-library/react 获取不到 stateNode
  // it('change component leaf isRoot is true', () => {
  //   const TextNode = new Node(textSchema, {
  //     isRoot: true,
  //     isRootNode: true,
  //   });

  //   nodeMap.set(textSchema.id, TextNode);

  //   const component = render(<Text _leaf={TextNode} content="content"></Text>);

  //   const inst = component.getByTestId('text');

  //   TextNode.emitPropChange({
  //     key: 'content',
  //     newValue: 'new content',
  //   } as any);

  //   expect(inst?._fiber.stateNode.renderUnitInfo).toEqual({
  //     singleRender: true,
  //   });
  // });

  // FIXME @testing-library/react 获取不到 stateNode
  // it('change component leaf parent isRoot is true', () => {
  //   const TextNode = new Node(textSchema, {
  //     parent: new Node(
  //       {
  //         id: 'first-parent',
  //       },
  //       {
  //         componentMeta: {
  //           isMinimalRenderUnit: true,
  //         },
  //         parent: new Node(
  //           {
  //             id: 'rootId',
  //           },
  //           {
  //             isRoot: true,
  //             isRootNode: true,
  //           },
  //         ),
  //       },
  //     ),
  //   });

  //   nodeMap.set(textSchema.id, TextNode);

  //   const component = render(<Text _leaf={TextNode} content="content"></Text>);

  //   const inst = component.getByTestId('text');

  //   TextNode.emitPropChange({
  //     key: 'content',
  //     newValue: 'new content',
  //   } as any);

  //   expect(inst?._fiber.stateNode.renderUnitInfo).toEqual({
  //     singleRender: false,
  //     minimalUnitId: 'first-parent',
  //     minimalUnitName: undefined,
  //   });
  // });

  it('parent is a mock leaf', () => {
    const MiniRenderDivNode = {
      isMock: true,
    };

    const component = render(
      <MiniRenderDiv _leaf={MiniRenderDivNode}>
        <Text _leaf={TextNode} content="content"></Text>
      </MiniRenderDiv>,
    );

    TextNode.emitPropChange({
      key: 'content',
      newValue: 'new content to mock',
    } as any);

    makeSnapshot(component);
  });

  it('props has new children', () => {
    MiniRenderDivNode.schema.props.children = ['children 01', 'children 02'];

    TextNode.emitPropChange({
      key: 'content',
      newValue: 'props',
    });

    makeSnapshot(component);
  });

  it('leaf has a loop, render from parent', () => {
    MiniRenderDivNode = new Node(miniRenderSchema, {});

    TextNode = new Node(textSchema, {
      parent: MiniRenderDivNode,
      hasLoop: true,
    });

    nodeMap.set(textSchema.id, TextNode);
    nodeMap.set(miniRenderSchema.id, MiniRenderDivNode);

    component = render(
      <MiniRenderDiv _leaf={MiniRenderDivNode}>
        <Text _leaf={TextNode} content="content"></Text>
      </MiniRenderDiv>,
    );

    MiniRenderDivNode.schema.children = ['this is a new children'];

    TextNode.emitPropChange({
      key: 'content',
      newValue: '1',
    });

    makeSnapshot(component);
  });
});

describe('component cache', () => {
  it('get different component with same is and different doc id', () => {
    const baseRenderer02 = {
      ...baseRenderer,
      props: {
        ...baseRenderer.props,
        documentId: '02',
      },
    };
    const Div3 = leafWrapper(components.Div as any, {
      schema: divSchema,
      baseRenderer: baseRenderer02,
      componentInfo: {},
      scope: {},
    });

    expect(Div).not.toEqual(Div3);
  });

  it('get component again and get ths cache component', () => {
    const Div2 = leafWrapper(components.Div as any, {
      schema: divSchema,
      baseRenderer,
      componentInfo: {},
      scope: {},
    });

    expect(Div).toEqual(Div2);
  });
});

describe('onVisibleChange', () => {
  it('visible is false', () => {
    TextNode.emitVisibleChange(false);
    makeSnapshot(component);
  });

  it('visible is true', () => {
    TextNode.emitVisibleChange(true);
    makeSnapshot(component);
  });
});

describe('children', () => {
  it('this.props.children is array', () => {
    const component = render(
      <Div _leaf={DivNode}>
        <Text _leaf={TextNode} content="content"></Text>
        <Text _leaf={TextNode} content="content"></Text>
      </Div>,
    );

    makeSnapshot(component);
  });
});

describe('onChildrenChange', () => {
  it('children is array string', async () => {
    DivNode.schema.children = ['onChildrenChange content 01', 'onChildrenChange content 02'];

    await act(() => {
      DivNode.emitChildrenChange();
    });
    await sleep(0);
    makeSnapshot(component);
  });

  it('children is 0', async () => {
    DivNode.schema.children = 0;
    await act(() => {
      DivNode.emitChildrenChange();
    });
    await sleep(0);
    const dom = await screen.findByText(0);
    expect(dom).toBeTruthy();
  });

  it('children is false', async () => {
    DivNode.schema.children = false;
    DivNode.emitChildrenChange();
    await sleep();
    expect(screen.findByText('false')).toBeTruthy();
  });

  it('children is []', async () => {
    DivNode.schema.children = [];
    DivNode.emitChildrenChange();
    await sleep();
    const dom = await screen.findByTestId('div');
    expect(dom.textContent).toEqual('');
  });

  it('children is null', async () => {
    DivNode.schema.children = null;
    DivNode.emitChildrenChange();
    await sleep();
    const dom = await screen.findByTestId('div');
    expect(dom.textContent).toEqual('');
  });

  it('children is undefined', async () => {
    DivNode.schema.children = undefined;
    DivNode.emitChildrenChange();
    const dom = await screen.findByTestId('div');
    expect(dom.textContent).toEqual('');
  });
});

describe('not render leaf', () => {
  let miniRenderSchema, MiniRenderDiv, MiniRenderDivNode;
  beforeEach(() => {
    miniRenderSchema = {
      id: 'miniDiv' + id,
    };

    MiniRenderDivNode = new Node(miniRenderSchema, {
      componentMeta: {
        isMinimalRenderUnit: true,
      },
    });

    nodeMap.set(miniRenderSchema.id, MiniRenderDivNode);

    MiniRenderDiv = leafWrapper(components.MiniRenderDiv as any, {
      schema: miniRenderSchema,
      baseRenderer,
      componentInfo: {},
      scope: {},
    });

    TextNode = new Node(textSchema, {
      parent: MiniRenderDivNode,
    });

    component = render(<Text _leaf={TextNode} content="content"></Text>);
  });

  it('onPropsChange', async () => {
    const nextCount = rerenderCount + 1;

    MiniRenderDivNode.emitPropChange({
      key: 'any',
      newValue: 'any',
    });
    await sleep(100);

    expect(rerenderCount).toBe(nextCount);
  });

  it('onChildrenChange', async () => {
    const nextCount = rerenderCount + 1;

    MiniRenderDivNode.emitChildrenChange({
      key: 'any',
      newValue: 'any',
    });
    await sleep(100);

    expect(rerenderCount).toBe(nextCount);
  });

  it('onVisibleChange', async () => {
    const nextCount = rerenderCount + 1;

    MiniRenderDivNode.emitVisibleChange(true);
    await sleep(100);

    expect(rerenderCount).toBe(nextCount);
  });
});
