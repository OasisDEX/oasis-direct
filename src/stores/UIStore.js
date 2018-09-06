import { observable, action } from 'mobx';

export const SWITCH = {
  ON: true,
  OFF: false
};

class UIStore {
  @observable loading = false;
  @observable hw = false;

  @action toggleLoading = (state) => {
    if (typeof state === 'boolean') {
      this.loading = state;
    }
  };

  @action toggleHWView = (state) => {
    if (typeof state === 'boolean') {
      this.hw = state;
    }
  };
}

export default UIStore;