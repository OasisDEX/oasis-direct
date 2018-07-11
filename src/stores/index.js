import network from './Network';
import profile from './Profile';
import transactions from './Transactions';
import system from './System';

const stores = { network, profile, transactions, system };

network.profile = profile;
network.transactions = transactions;
network.system = system;

profile.transactions = transactions;

transactions.network = network;
transactions.profile = profile;
transactions.system = system;

system.network = network;
system.profile = profile;
system.transactions = transactions;

window.stores = stores;

export default stores;