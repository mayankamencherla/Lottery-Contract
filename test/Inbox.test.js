// Functional tests for the contracts
const assert = require('assert');
const ganache = require('ganache-cli');

const Web3 = require('web3'); // constructor 

// Ganache supplies provider
// Ganache creates accounts to use - acts as the account for user 
const web3 = new Web3(ganache.provider());

const {interface, bytecode} = require('../compile');

let accounts;
let lottery;

beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts(); // eth stands for ethereum
    console.log(accounts);

    // Use one of these accounts to deploy the contract
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({data: bytecode}) // arguments are passed into the constructor
        .send({from: accounts[0], gas: '1000000'}); // Using first account for deployment
    console.log(lottery);
});

// Deploy contract to ganache, manipulate contract and assert
describe('Lottery', () => {
    it('accounts not null', () => { assert.notEqual(accounts, null); });

    it('deploys a contract', () => { 
        assert.notEqual(lottery, null);
        assert.ok(lottery.options.address); // exists
    });

    it('Has current account as manager', async () => {
        const manager = await lottery.methods.manager().call();

        assert.equal(manager, accounts[0]);
    });

    it('should add a new player', async () => {
        // We are modifying the blockchain by modifying the contract data
        await lottery.methods.enter().send({from: accounts[1], value: web3.utils.toWei('0.02', 'ether') });
        const players = await lottery.methods.getPlayers().call();

        assert.equal(players.length, 1);
        assert.equal(players[0], accounts[1]);
    });

    it('allows multiple accounts to enter', async () => {
        // We are modifying the blockchain by modifying the contract data
        await lottery.methods.enter().send({from: accounts[1], value: web3.utils.toWei('0.02', 'ether') });
        await lottery.methods.enter().send({from: accounts[2], value: web3.utils.toWei('0.02', 'ether') });
        await lottery.methods.enter().send({from: accounts[3], value: web3.utils.toWei('0.02', 'ether') });
        const players = await lottery.methods.getPlayers().call();

        assert.equal(players.length, 3);
        assert.equal(players[0], accounts[1]);
        assert.equal(players[1], accounts[2]);
        assert.equal(players[2], accounts[3]);
    });

    it('should send appropriate amount of ether to enter lottery', async() => {
        try {
            await lottery.methods.enter().end({from: accounts[1], value: 200});
            assert(false);
        } catch (e) {
            assert(e);
        }
    });

    it('only manager can call pickWinner', async() => {
        await lottery.methods.enter().send({from: accounts[1], value: web3.utils.toWei('0.02', 'ether') });
        await lottery.methods.enter().send({from: accounts[2], value: web3.utils.toWei('0.02', 'ether') });
        await lottery.methods.enter().send({from: accounts[3], value: web3.utils.toWei('0.02', 'ether') });

        try {
            await lottery.methodos.pickWinner().send({from: accounts[1]});
            assert(false);
        } catch (e) {
            assert(e);
        }

        await lottery.methods.pickWinner().send({from: accounts[0]});
        assert(true);
    });

    it('sends money to winner and resets players array', async() => {
        await lottery.methods.enter().send({from: accounts[1], value: web3.utils.toWei('2', 'ether') });

        const balanceBeforeLottery = await web3.eth.getBalance(accounts[1]);

        await lottery.methods.pickWinner().send({from: accounts[0]});

        const balanceAfterLottery = await web3.eth.getBalance(accounts[1]);

        // User loses a little money for transaction cost 
        const difference = balanceAfterLottery - balanceBeforeLottery;

        assert(difference > web3.utils.toWei('1.8', 'ether'));
    });
});
