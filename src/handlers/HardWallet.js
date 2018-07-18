import * as Blockchain from "../blockchainHandler";

const onFulfilled = actionType => `${actionType}_FULFILLED`;
const onPending = actionType => `${actionType}_PENDING`;
const onRejected = actionType => `${actionType}_REJECTED`;

const newUnknownHW = (derivationPath = null) => {
  return {
    isConnected: false,
    showModal: false,
    option: null,
    derivationPath,
    addresses: [],
    addressIndex: null
  }
};

const ACTION_TYPES = {
  SELECT_ADDRESS: "HW/SELECT_ADDRESS",
  SETUP: "HW/SETUP",
  RESET: "HW/RESET",
  LOAD_ADDRESSES: "HW/LOAD_ADDRESSES",
};

const selectAddress = (address) => ({
  type: ACTION_TYPES.SELECT_ADDRESS,
  payload: {
    address
  }
});

const showDetails = (deviceType) => ({
  type: ACTION_TYPES.SETUP,
  payload: {
    type: deviceType
  }
});

const loadAddresses = (deviceType, network, amount, derivationPath) => ({
  type: ACTION_TYPES.LOAD_ADDRESSES,
  payload: async () => {
    try {
      await Blockchain.setHWProvider(deviceType, network, `${derivationPath.replace('m/', '')}/0`, 0, amount);
      const addresses = await Blockchain.getAccounts();
      console.log(addresses);
      return addresses;
    } catch (e) {
      console.log(e);
      Blockchain.stopProvider();
      return Promise.reject(e.message);
    }
  },
  meta: {
    derivationPath
  }
});

const resetSetup = () =>({
  type:ACTION_TYPES.RESET
});


const actions = {
  selectAddress,
  showDetails,
  loadAddresses,
  resetSetup,
};

const reducer = (state = newUnknownHW(), action) => {
  const current = {...state};
  const {type, meta, payload} = action;

  switch (type) {
    case(ACTION_TYPES.SELECT_ADDRESS):
      current.address = payload.address;
      return current;

    case(ACTION_TYPES.SETUP):
      current.option = payload.type;
      current.showModal = true;
      return current;

    case(ACTION_TYPES.RESET):
      return {...newUnknownHW()};

    case(onFulfilled(ACTION_TYPES.LOAD_ADDRESSES)):
      current.derivationPath = meta.derivationPath;
      current.addresses = payload;
      current.isConnected = true;
      current.hasError = false;
      return current;

    case(onPending(ACTION_TYPES.LOAD_ADDRESSES)):
      current.hasError = false;
      return current;

    case(onRejected(ACTION_TYPES.LOAD_ADDRESSES)):
      current.hasError = true;
      return current;

    default:
      return state;
  }
};

export { actions, reducer };