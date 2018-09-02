const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const {interface, bytecode} = require('./compile');

const provider = new HDWalletProvider(
    'senior myself flee soap eyebrow dirt asthma poverty poet dragon hold reason',
    'https://rinkeby.infura.io/v3/5b59e42abfeb49d48a12ae8dd36ca1ee'
);

// Getting an instance of web3 from the providers
const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    
    console.log('Attempting to deploy the contract', accounts.length, accounts[0]);

    const result = await new web3.eth.Contract(JSON.parse(interface))
                    .deploy({data: '0x' + bytecode})
                    .send({from: accounts[0], gas: '1000000'});

    // Can be added to react project
    console.log(interface);
    console.log('Deployed on ', result.options.address);
};

deploy();
