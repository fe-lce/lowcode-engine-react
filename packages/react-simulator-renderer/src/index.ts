import { runInAction } from 'mobx';
import renderer from './renderer';

if (typeof window !== 'undefined') {
  (window as any).SimulatorRenderer = renderer;
}

window.addEventListener('beforeunload', () => {
  runInAction(() => {
    (window as any).LCSimulatorHost.app?.unmount();
    (window as any).LCSimulatorHost = null;
    renderer.dispose?.();
    (window as any).SimulatorRenderer = null;
  });
});

export default renderer;
