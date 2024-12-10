import '@testing-library/dom';
import { BuiltinSimulatorHost, Designer, Project } from '@felce/lowcode-designer';
import EventEmitter from 'events';
class Editor {
  eventBus: EventEmitter;
  constructor() {
    this.eventBus = new EventEmitter();
  }
}

const designer = new Designer({
  editor: new Editor(),
  ShellModelFactory: {
    createNode(node) {
      return node;
    },
    createSettingField(props) {
      return props;
    },
  },
});
const project = new Project(designer);
const host = new BuiltinSimulatorHost(project, designer);
(window as any).LCSimulatorHost = host;
